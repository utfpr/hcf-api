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

describe('DELETE /api/v1/relevos/:relevoId', () => {
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

  test('remove um relevo sem uso', async () => {
    const nome = `livre-${Date.now()}`
    const [relevo] = await knex('relevos').insert({ nome }).returning<Relevo[]>(returning)

    try {
      const response = await agent.delete(`/api/v1/relevos/${relevo.id}`).set(authHeader).expect(204)
      expect(response.text).toBe('')
    } finally {
      await knex('relevos').where({ id: relevo.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.delete('/api/v1/relevos/999999').set(authHeader).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.delete('/api/v1/relevos/abc').set(authHeader).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('recusa a exclusão quando o tipo ainda está em uso em tombos', async () => {
    const nome = `em-uso-${Date.now()}`
    const [relevo] = await knex('relevos').insert({ nome }).returning<Relevo[]>(returning)
    const hcf = Date.now()

    await knex('tombos').insert({ hcf, relevo_id: relevo.id })

    try {
      const response = await agent.delete(`/api/v1/relevos/${relevo.id}`).set(authHeader).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/em uso|in use|tombos/i)
    } finally {
      await knex('tombos').where({ hcf }).delete()
      await knex('relevos').where({ id: relevo.id }).delete()
    }
  })
})
