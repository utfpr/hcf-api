import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth } from '../setup/curador-auth'

type Relevo = { id: string; nome: string }

const returning = ['id', 'nome'] as const

describe('PUT /api/v1/relevos/:relevoId', () => {
  const { agent, knex } = createTestApp()
  let authHeader: { Authorization: string }
  let cleanupAuth: () => Promise<void>

  beforeAll(async () => {
    const auth = await createCuradorAuth(knex)
    authHeader = auth.header
    cleanupAuth = auth.cleanup
  })

  afterAll(async () => {
    await cleanupAuth()
    await knex.destroy()
  })

  test('atualiza o nome do relevo', async () => {
    const nome = `plano-renomear-${Date.now()}`
    const [relevo] = await knex('relevos').insert({ nome }).returning<Relevo[]>(returning)

    try {
      const novoNome = `ondulado-${Date.now()}`
      const response = await agent.put(`/api/v1/relevos/${relevo.id}`).set(authHeader).send({ nome: ` ${novoNome} ` }).expect(200)
      expect(response.body).toEqual({ id: relevo.id, nome: novoNome })
    } finally {
      await knex('relevos').where({ id: relevo.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.put('/api/v1/relevos/999999').set(authHeader).send({ nome: 'ondulado' }).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.put('/api/v1/relevos/abc').set(authHeader).send({ nome: 'ondulado' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 400 quando o nome é vazio', async () => {
    const nome = `plano-vazio-${Date.now()}`
    const [relevo] = await knex('relevos').insert({ nome }).returning<Relevo[]>(returning)

    try {
      const response = await agent.put(`/api/v1/relevos/${relevo.id}`).set(authHeader).send({ nome: '   ' }).expect(400)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/vazio|empty/i)
    } finally {
      await knex('relevos').where({ id: relevo.id }).delete()
    }
  })

  test('retorna 409 quando o novo nome já existe em outra linha', async () => {
    const nomeOriginal = `plano-conflito-${Date.now()}`
    const nomeDuplicado = `ondulado-conflito-${Date.now()}`
    const [relevo] = await knex('relevos').insert({ nome: nomeOriginal }).returning<Relevo[]>(returning)
    const [outro] = await knex('relevos').insert({ nome: nomeDuplicado }).returning<Relevo[]>(returning)

    try {
      const response = await agent.put(`/api/v1/relevos/${relevo.id}`).set(authHeader).send({ nome: nomeDuplicado.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|already exists/i)
    } finally {
      await knex('relevos').where({ id: relevo.id }).orWhere({ id: outro.id }).delete()
    }
  })
})
