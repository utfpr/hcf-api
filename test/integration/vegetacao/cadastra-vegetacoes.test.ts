import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth } from '../setup/curador-auth'

type Vegetacao = { id: string; nome: string }

describe('POST /api/v2/vegetacoes', () => {
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

  test('retorna 401 sem Authorization', async () => {
    await agent.post('/api/v2/vegetacoes').send({ nome: 'Mata' }).expect(401)
  })

  test('cadastra uma vegetação com sucesso', async () => {
    const prefix = `CADVEG-${Date.now()}`
    const nome = `${prefix} Mata Atlântica`

    try {
      const response = await agent.post('/api/v2/vegetacoes').set(authHeader).send({ nome }).expect(201)
      const body = response.body as Vegetacao

      expect(body).toMatchObject({ nome })
      expect(body.id).toMatch(/^\d+$/)
      expect(BigInt(body.id)).toBeGreaterThan(0n)

      await knex('vegetacoes').where({ id: body.id }).delete()
    } catch (error) {
      await knex('vegetacoes').where('nome', 'like', `${prefix}%`).delete()
      throw error
    }
  })

  test('retorna 400 quando o nome está vazio', async () => {
    const response = await agent.post('/api/v2/vegetacoes').set(authHeader).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/vazio|empty|obrigat/i)
  })

  test('retorna 409 para nome duplicado sem diferenciar maiúsculas e minúsculas', async () => {
    const prefix = `DUPVEG-${Date.now()}`
    const nome = `${prefix} Cerrado`

    await knex('vegetacoes').insert({ nome })

    try {
      const response = await agent.post('/api/v2/vegetacoes').set(authHeader).send({ nome: nome.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('vegetacoes').where({ nome }).delete()
    }
  })
})
