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

describe('PUT /api/v2/vegetacoes/:vegetacaoId', () => {
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

  test('atualiza uma vegetação existente', async () => {
    const prefix = `UPDVEG-${Date.now()}`
    const [vegetacao] = await knex<Vegetacao>('vegetacoes')
      .insert({ nome: `${prefix} Antiga` })
      .returning(['id', 'nome']) as Vegetacao[]

    try {
      const response = await agent.put(`/api/v2/vegetacoes/${vegetacao.id}`).set(authHeader).send({ nome: `${prefix} Nova` }).expect(200)
      const body = response.body as Vegetacao

      expect(body).toEqual({ id: vegetacao.id, nome: `${prefix} Nova` })
    } finally {
      await knex('vegetacoes').where({ id: vegetacao.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.put('/api/v2/vegetacoes/999999').set(authHeader).send({ nome: 'Qualquer' }).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.put('/api/v2/vegetacoes/abc').set(authHeader).send({ nome: 'Qualquer' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 400 quando o nome está vazio', async () => {
    const prefix = `EMPTYUPD-${Date.now()}`
    const [vegetacao] = await knex<Vegetacao>('vegetacoes')
      .insert({ nome: `${prefix} Original` })
      .returning(['id', 'nome']) as Vegetacao[]

    try {
      const response = await agent.put(`/api/v2/vegetacoes/${vegetacao.id}`).set(authHeader).send({ nome: '   ' }).expect(400)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/vazio|empty|obrigat/i)
    } finally {
      await knex('vegetacoes').where({ id: vegetacao.id }).delete()
    }
  })

  test('retorna 409 para nome duplicado sem diferenciar maiúsculas e minúsculas', async () => {
    const prefix = `DUPUPD-${Date.now()}`
    const [original] = await knex<Vegetacao>('vegetacoes')
      .insert({ nome: `${prefix} Original` })
      .returning(['id', 'nome']) as Vegetacao[]

    const [other] = await knex<Vegetacao>('vegetacoes')
      .insert({ nome: `${prefix} Outro` })
      .returning(['id', 'nome']) as Vegetacao[]

    try {
      const response = await agent.put(`/api/v2/vegetacoes/${other.id}`).set(authHeader).send({ nome: original.nome.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('vegetacoes').whereIn('id', [original.id, other.id]).delete()
    }
  })
})
