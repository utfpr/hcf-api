import jwt from 'jsonwebtoken'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth, createUsuarioAuth } from '../setup/curador-auth'
import { insertLocalColeta, insertLocalColetaCidade } from '../setup/local-coleta-fixtures'

type LocalColetaResponse = {
  id: number | string
  descricao: string
  fase_sucessional_id: number | string | null
}
type ApiErrorResponse = { error: { message: string } }

describe('PUT /api/v1/locais-coleta/:localColetaId', () => {
  const { agent, knex } = createTestApp()
  let curadorHeader: { Authorization: string }
  let operadorHeader: { Authorization: string }
  let leitorHeader: { Authorization: string }
  let cleanupCurador: () => Promise<void>
  let cleanupOperador: () => Promise<void>
  let cleanupLeitor: () => Promise<void>

  beforeAll(async () => {
    const curador = await createCuradorAuth(knex)
    const operador = await createUsuarioAuth(knex, 2, 'Operador')
    const leitor = await createUsuarioAuth(knex, 3, 'Identificador')
    curadorHeader = curador.header
    operadorHeader = operador.header
    leitorHeader = leitor.header
    cleanupCurador = curador.cleanup
    cleanupOperador = operador.cleanup
    cleanupLeitor = leitor.cleanup
  })

  afterAll(async () => {
    await cleanupLeitor?.()
    await cleanupOperador?.()
    await cleanupCurador?.()
    await knex.destroy()
  })

  test('renomeia como Operador e preserva a fase omitida', async () => {
    const cidade = await insertLocalColetaCidade(knex)
    const [fase] = await knex('fase_sucessional')
      .insert({ nome: `Fase teste ${Date.now()}` })
      .returning<{ id: number }[]>('id')
    const localColetaId = await insertLocalColeta(knex, cidade.id, 'Nome anterior', Number(fase.id))

    try {
      const response = await agent.put(`/api/v1/locais-coleta/${localColetaId}`)
        .set(operadorHeader)
        .send({ descricao: '  Nome   atualizado ', cidade_id: cidade.id })
        .expect(200)
      const body = response.body as LocalColetaResponse

      expect(String(body.id)).toBe(localColetaId)
      expect(body.descricao).toBe('Nome atualizado')
      expect(Number(body.fase_sucessional_id)).toBe(Number(fase.id))
    } finally {
      await knex('locais_coleta').where({ id: localColetaId }).delete()
      await knex('fase_sucessional').where({ id: fase.id }).delete()
      await cidade.cleanup()
    }
  })

  test('retorna 400 para ID, descrição, cidade ou fase inválidos e 404 para local inexistente', async () => {
    const cidade = await insertLocalColetaCidade(knex)

    try {
      await agent.put('/api/v1/locais-coleta/abc')
        .set(curadorHeader)
        .send({ descricao: 'Novo nome', cidade_id: cidade.id })
        .expect(400)
      await agent.put('/api/v1/locais-coleta/999999999')
        .set(curadorHeader)
        .send({ descricao: 'Novo nome', cidade_id: cidade.id })
        .expect(404)
      await agent.put('/api/v1/locais-coleta/999999999')
        .set(curadorHeader)
        .send({ descricao: '  ', cidade_id: cidade.id })
        .expect(400)
      await agent.put('/api/v1/locais-coleta/999999999')
        .set(curadorHeader)
        .send({ descricao: 'Sem cidade' })
        .expect(400)
      await agent.put('/api/v1/locais-coleta/999999999')
        .set(curadorHeader)
        .send({ descricao: 'Cidade inválida', cidade_id: 'abc' })
        .expect(400)
      await agent.put('/api/v1/locais-coleta/999999999')
        .set(curadorHeader)
        .send({
          descricao: 'Fase inválida',
          cidade_id: cidade.id,
          fase_sucessional_id: 'abc'
        })
        .expect(400)
    } finally {
      await cidade.cleanup()
    }
  })

  test('retorna 409 ao renomear para descrição já usada na cidade', async () => {
    const cidade = await insertLocalColetaCidade(knex)
    const primeiroId = await insertLocalColeta(knex, cidade.id, 'Local existente')
    const segundoId = await insertLocalColeta(knex, cidade.id, 'Outro local')

    try {
      const response = await agent.put(`/api/v1/locais-coleta/${segundoId}`)
        .set(curadorHeader)
        .send({ descricao: 'local EXISTENTE', cidade_id: cidade.id })
        .expect(409)
      expect((response.body as ApiErrorResponse).error.message).toMatch(/já existe|already exists/i)
    } finally {
      await knex('locais_coleta').whereIn('id', [primeiroId, segundoId]).delete()
      await cidade.cleanup()
    }
  })

  test('retorna 401 sem token', async () => {
    await agent.put('/api/v1/locais-coleta/1')
      .send({ descricao: 'Sem token', cidade_id: 1 })
      .expect(401)
  })

  test('retorna 401 para token vazio, inválido ou expirado', async () => {
    const expiredToken = jwt.sign(
      {
        id: 1,
        tipo_usuario_id: 1,
        exp: Math.floor(Date.now() / 1000) - 60
      },
      process.env.JWT_SECRET as string
    )
    const invalidToken = jwt.sign({ id: 1, tipo_usuario_id: 1 }, 'segredo-diferente')
    const headers = [
      { Authorization: 'Bearer ' },
      { Authorization: `Bearer ${invalidToken}` },
      { Authorization: `Bearer ${expiredToken}` }
    ]

    for (const header of headers) {
      await agent.put('/api/v1/locais-coleta/1')
        .set(header)
        .send({ descricao: 'Token não autorizado', cidade_id: 1 })
        .expect(401)
    }
  })

  test('retorna 403 para usuário sem permissão de escrita', async () => {
    const cidade = await insertLocalColetaCidade(knex)
    const localColetaId = await insertLocalColeta(knex, cidade.id, 'Local protegido')

    try {
      await agent.put(`/api/v1/locais-coleta/${localColetaId}`)
        .set(leitorHeader)
        .send({ descricao: 'Não permitido', cidade_id: cidade.id })
        .expect(403)
    } finally {
      await knex('locais_coleta').where({ id: localColetaId }).delete()
      await cidade.cleanup()
    }
  })
})
