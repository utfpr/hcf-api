import express from 'express'
import jwt from 'jsonwebtoken'
import {
  afterAll, describe, expect, it
} from 'vitest'

import models from '@/models'
import rfids from '@/routes/rfids'

import { createTestApp } from '../setup/app-factory'

const router = express.Router()
rfids(router)
const { agent, knex } = createTestApp(router)
type GravacaoResponse = { rfid: { id: number; epc: string } }
const curador = { Authorization: `Bearer ${jwt.sign({ id: 1, tipo_usuario_id: 1 }, process.env.JWT_SECRET as string)}` }
const operador = { Authorization: `Bearer ${jwt.sign({ id: 2, tipo_usuario_id: 2 }, process.env.JWT_SECRET as string)}` }

afterAll(async () => {
  await knex.destroy()
  await (models.sequelize as { close: () => Promise<void> }).close()
})

async function criarVinculo() {
  const [tombo] = await knex('tombos').insert({ nome_cientifico: 'Teste desvinculacao RFID' }).returning<{ hcf: string }[]>('hcf')
  const [foto] = await knex('tombos_fotos').insert({ tombo_hcf: tombo.hcf, codigo_barra: `HCF${tombo.hcf}` }).returning<{ id: string }[]>('id')
  const inicio = await agent.post('/api/rfids/iniciar-gravacao').set(curador).send({ tombo_foto_id: foto.id }).expect(201)
  const { rfid } = inicio.body as GravacaoResponse
  const tid = `E280${tombo.hcf.padStart(20, '0')}`
  await agent.put(`/api/rfids/finalizar-gravacao/${rfid.id}`).set(curador).send({ status: 'CONCLUIDO', tid }).expect(200)
  return {
    tombo,
    foto,
    rfid,
    tid,
    cleanup: async () => {
      await knex('tombos_fotos').where({ id: foto.id }).delete()
      await knex('tombos').where({ hcf: tombo.hcf }).delete()
    }
  }
}

describe('DELETE /api/rfids/:id', () => {
  it('não confirma uma gravação se o vínculo for removido depois da leitura inicial', async () => {
    const dados = await criarVinculo()
    const rfidModel = models.Rfid as {
      addHook: (tipo: string, nome: string, callback: () => Promise<void>) => void
      removeHook: (tipo: string, nome: string) => void
    }
    const hook = 'desvinculacao-durante-finalizacao'
    try {
      await knex('rfids').where({ id: dados.rfid.id }).update({ status: 'PENDENTE', tid: null })
      rfidModel.addHook('afterFind', hook, async () => {
        rfidModel.removeHook('afterFind', hook)
        await agent.delete(`/api/rfids/${dados.rfid.id}`).set(curador).expect(204)
      })
      await agent.put(`/api/rfids/finalizar-gravacao/${dados.rfid.id}`)
        .set(curador).send({ status: 'CONCLUIDO', tid: dados.tid }).expect(404)
      expect(await knex('rfids').where({ id: dados.rfid.id }).first()).toBeUndefined()
    } finally {
      rfidModel.removeHook('afterFind', hook)
      await dados.cleanup()
    }
  })

  it('remove o vínculo, preserva tombo/foto/inventário e permite vincular novamente o mesmo EPC/TID', async () => {
    const dados = await criarVinculo()
    const [lista] = await knex('listas_conferencias').insert({ nome: 'Teste desvinculacao RFID' }).returning<{ id: number }[]>('id')
    const historico = { encontrados: [dados.tid], nao_encontrados: [] }
    try {
      await knex('listas_conferencias_rfids').insert({ lista_conferencia_id: lista.id, rfid_id: dados.rfid.id })
      const [inventario] = await knex('inventarios').insert({
        lista_conferencia_id: lista.id, total_esperado: 1, total_encontrados: 1, status: historico
      }).returning<{ id: number }[]>('id')

      await agent.delete(`/api/rfids/${dados.rfid.id}`).set(curador).expect(204)
      expect(await knex('rfids').where({ id: dados.rfid.id }).first()).toBeUndefined()
      expect(await knex('tombos_fotos').where({ id: dados.foto.id }).first()).toBeDefined()
      expect(await knex('tombos').where({ hcf: dados.tombo.hcf }).first()).toBeDefined()
      expect(await knex('listas_conferencias_rfids').where({ lista_conferencia_id: lista.id })).toHaveLength(0)
      expect(await knex('listas_conferencias').where({ id: lista.id }).first()).toBeDefined()
      expect(await knex('inventarios').where({ id: inventario.id }).first()).toMatchObject({
        status: historico, total_esperado: 1, total_encontrados: 1
      })
      await agent.get(`/api/rfids/validar-tid/${dados.tid}`).set(curador).expect(404)

      const pendentes = await agent.get('/api/rfids/tombos-pendentes').query({ tombo_hcf: dados.tombo.hcf }).set(curador).expect(200)
      expect((pendentes.body as { dados: unknown[] }).dados).toEqual(expect.arrayContaining([expect.objectContaining({ id: dados.foto.id })]))
      const novo = await agent.post('/api/rfids/iniciar-gravacao').set(curador).send({ tombo_foto_id: dados.foto.id }).expect(201)
      const novoVinculo = novo.body as GravacaoResponse
      expect(novoVinculo.rfid.epc).toBe(dados.rfid.epc)
      await agent.put(`/api/rfids/finalizar-gravacao/${novoVinculo.rfid.id}`).set(curador).send({ status: 'CONCLUIDO', tid: dados.tid }).expect(200)
      const relido = await agent.get(`/api/rfids/validar-tid/${dados.tid}`).set(curador).expect(200)
      expect((relido.body as { dados: { tombo_hcf: string } }).dados.tombo_hcf).toBe(dados.tombo.hcf)
    } finally {
      await knex('inventarios').where({ lista_conferencia_id: lista.id }).delete()
      await knex('listas_conferencias').where({ id: lista.id }).delete()
      await dados.cleanup()
    }
  })

  it('nega acesso sem token ou sem perfil curador e preserva o vínculo', async () => {
    const dados = await criarVinculo()
    try {
      await agent.delete(`/api/rfids/${dados.rfid.id}`).expect(403)
      await agent.delete(`/api/rfids/${dados.rfid.id}`).set(operador).expect(403)
      expect(await knex('rfids').where({ id: dados.rfid.id }).first()).toMatchObject({ tid: dados.tid })
    } finally {
      await dados.cleanup()
    }
  })

  it.each([
    '0',
    '-1',
    '1.5',
    'abc',
    '9007199254740992'
  ])('rejeita ID inválido %s', async id => {
    await agent.delete(`/api/rfids/${id}`).set(curador).expect(400)
  })

  it('retorna 404 quando o vínculo já foi removido, inclusive em exclusões simultâneas', async () => {
    const dados = await criarVinculo()
    try {
      const respostas = await Promise.all([
        agent.delete(`/api/rfids/${dados.rfid.id}`).set(curador),
        agent.delete(`/api/rfids/${dados.rfid.id}`).set(curador)
      ])
      expect(respostas.map(resposta => resposta.status).sort()).toEqual([204, 404])
      await agent.delete(`/api/rfids/${dados.rfid.id}`).set(curador).expect(404)
    } finally {
      await dados.cleanup()
    }
  })
})
