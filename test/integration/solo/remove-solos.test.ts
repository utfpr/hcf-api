import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Solo = { id: number; nome: string }

const TEST_JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret'
const buildAuthHeader = () => ({
  Authorization: `Bearer ${jwt.sign({ id: 1, tipo_usuario_id: 1 }, TEST_JWT_SECRET)}`
})

describe('DELETE /api/v2/solos/:soloId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('remove um solo sem dependências', async () => {
    const prefix = `DELSOL-${Date.now()}`
    const [solo] = await knex<Solo>('solos')
      .insert({ nome: `${prefix} Removível` })
      .returning(['id', 'nome']) as Solo[]

    try {
      await agent.delete(`/api/v2/solos/${solo.id}`).set(buildAuthHeader()).expect(204)
      const found = await knex('solos').where({ id: solo.id }).first()
      expect(found).toBeUndefined()
    } finally {
      await knex('solos').where('nome', 'like', `${prefix}%`).delete()
    }
  })

  test('retorna 404 quando o solo não existe', async () => {
    const response = await agent.delete('/api/v2/solos/999999').set(buildAuthHeader()).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 quando o id é inválido', async () => {
    const response = await agent.delete('/api/v2/solos/abc').set(buildAuthHeader()).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 409 quando o solo está em uso em um tombo', async () => {
    const prefix = `USESOL-${Date.now()}`
    const [solo] = await knex<Solo>('solos')
      .insert({ nome: `${prefix} Em Uso` })
      .returning(['id', 'nome']) as Solo[]

    try {
      await knex('tombos').insert({
        hcf: 9000000000 + Date.now(),
        solo_id: solo.id,
        ativo: true,
        rascunho: false,
        created_at: new Date(),
        updated_at: new Date()
      })

      const response = await agent.delete(`/api/v2/solos/${solo.id}`).set(buildAuthHeader()).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/em uso|in use|uso/i)
    } finally {
      await knex('tombos').where({ solo_id: solo.id }).delete()
      await knex('solos').where({ id: solo.id }).delete()
    }
  })
})
