import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth, createUsuarioAuth } from '../setup/curador-auth'

describe('GET /api/v1/locais-coleta/:localColetaId', () => {
  const { agent, knex } = createTestApp()
  let auth: Awaited<ReturnType<typeof createCuradorAuth>>

  beforeAll(async () => {
    auth = await createCuradorAuth(knex)
  })

  afterAll(async () => {
    await auth?.cleanup()
    await knex.destroy()
  })

  const getAuthorized = (path: string) => agent.get(path).set(auth.header)

  test('retorna o local com cidade, estado, país e fase sucessional', async () => {
    const suffix = Date.now()
    const prefix = `XLC-${suffix}`
    const [pais] = await knex('paises')
      .insert({ nome: `${prefix} País`, sigla: `P${String(suffix).slice(-3)}` })
      .returning(['id']) as Array<{ id: number }>
    const [estado] = await knex('estados')
      .insert({
        nome: `${prefix} Estado`,
        sigla: `E${String(suffix).slice(-3)}`,
        pais_id: pais.id
      })
      .returning(['id']) as Array<{ id: number }>
    const [cidade] = await knex('cidades')
      .insert({ nome: `${prefix} Cidade`, estado_id: estado.id })
      .returning(['id']) as Array<{ id: number }>
    const [fase] = await knex('fase_sucessional')
      .insert({ nome: `${prefix} Fase` })
      .returning(['id']) as Array<{ id: number }>
    const [local] = await knex('locais_coleta')
      .insert({
        descricao: `${prefix} Local`,
        cidade_id: cidade.id,
        fase_sucessional_id: fase.id
      })
      .returning(['id']) as Array<{ id: number }>

    try {
      const response = await getAuthorized(`/api/v1/locais-coleta/${local.id}`).expect(200)
      expect(response.body).toMatchObject({
        id: local.id,
        descricao: `${prefix} Local`,
        cidade: {
          id: cidade.id,
          nome: `${prefix} Cidade`,
          estado: {
            id: estado.id,
            nome: `${prefix} Estado`,
            pais: { id: pais.id, nome: `${prefix} País` }
          }
        },
        fase_sucessional: { id: fase.id, nome: `${prefix} Fase` }
      })
    } finally {
      await knex('locais_coleta').where({ id: local.id }).delete()
      await knex('fase_sucessional').where({ id: fase.id }).delete()
      await knex('cidades').where({ id: cidade.id }).delete()
      await knex('estados').where({ id: estado.id }).delete()
      await knex('paises').where({ id: pais.id }).delete()
    }
  })

  test('retorna 404 para local inexistente', async () => {
    const missing = await getAuthorized('/api/v1/locais-coleta/999999999').expect(404)
    const missingBody = missing.body as { error: { message: string } }
    expect(missingBody.error.message).toMatch(/não encontrad[ao]|not found/i)
  })

  test('retorna 400 para id não numérico ou negativo', async () => {
    const respostas = await Promise.all([
      getAuthorized('/api/v1/locais-coleta/invalido').expect(400),
      getAuthorized('/api/v1/locais-coleta/-12').expect(400)
    ])

    for (const resposta of respostas) {
      const body = resposta.body as { error: { message: string } }
      expect(body.error.message).toMatch(/localColetaId inválido/i)
    }
  })

  test('exige token e bloqueia tipos fora das permissões legadas', async () => {
    await agent.get('/api/v1/locais-coleta/1').expect(401)

    const authNaoPermitido = await createUsuarioAuth(knex, 99, 'Sem permissão')
    try {
      await agent.get('/api/v1/locais-coleta/1').set(authNaoPermitido.header).expect(403)
    } finally {
      await authNaoPermitido.cleanup()
    }
  })
})
