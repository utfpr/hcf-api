import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Relevo = { id: number; nome: string }

const returning = ['id', 'nome'] as const

const buildAuthHeader = (payload = { id: 1, tipo_usuario_id: 1 }, secret = process.env.JWT_SECRET as string) => ({
  Authorization: `Bearer ${jwt.sign(payload, secret)}`
})

describe('DELETE /api/v2/relevos/:relevoId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('remove um relevo sem uso', async () => {
    const nome = `livre-${Date.now()}`
    const [relevo] = await knex('relevos').insert({ nome }).returning<Relevo[]>(returning)

    try {
      const response = await agent.delete(`/api/v2/relevos/${relevo.id}`).set(buildAuthHeader()).expect(204)
      expect(response.text).toBe('')
    } finally {
      await knex('relevos').where({ id: relevo.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.delete('/api/v2/relevos/999999').set(buildAuthHeader()).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.delete('/api/v2/relevos/abc').set(buildAuthHeader()).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('recusa a exclusão quando o tipo ainda está em uso em tombos', async () => {
    const nome = `em-uso-${Date.now()}`
    const [relevo] = await knex('relevos').insert({ nome }).returning<Relevo[]>(returning)
    const hcf = Date.now()

    await knex('tombos').insert({ hcf, relevo_id: relevo.id })

    try {
      const response = await agent.delete(`/api/v2/relevos/${relevo.id}`).set(buildAuthHeader()).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/em uso|in use|tombos/i)
    } finally {
      await knex('tombos').where({ hcf }).delete()
      await knex('relevos').where({ id: relevo.id }).delete()
    }
  })
})
