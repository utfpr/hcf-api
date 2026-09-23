import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type FaseSucessionalAttributes = { id: number; nome: string }

const TEST_JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret'

const buildAuthHeader = () => {
  const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, TEST_JWT_SECRET)
  return { Authorization: `Bearer ${token}` }
}

describe('DELETE /api/v2/fases-sucessionais/:faseSucessionalId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('remove uma vegetação sem dependências', async () => {
    const prefix = `DELVEG-${Date.now()}`
    const [faseSucessional] = await knex<FaseSucessionalAttributes>('fase_sucessional')
      .insert({ nome: `${prefix} Removível` })
      .returning(['id', 'nome']) as FaseSucessionalAttributes[]

    try {
      await agent.delete(`/api/v2/fases-sucessionais/${faseSucessional.id}`).set(buildAuthHeader()).expect(204)
      const found = await knex('fase_sucessional').where({ id: faseSucessional.id }).first()
      expect(found).toBeUndefined()
    } finally {
      await knex('fase_sucessional').where('nome', 'like', `${prefix}%`).delete()
    }
  })

  test('retorna 409 quando a vegetação está em uso em um tombo', async () => {
    const prefix = `USEVEG-${Date.now()}`
    const [faseSucessional] = await knex<FaseSucessionalAttributes>('fase_sucessional')
      .insert({ nome: `${prefix} Em Uso` })
      .returning(['id', 'nome']) as FaseSucessionalAttributes[]

    try {
      await knex('tombos').insert({
        hcf: 9000000000 + Date.now(),
        fase_sucessional_id: faseSucessional.id,
        ativo: true,
        rascunho: false,
        created_at: new Date(),
        updated_at: new Date()
      })

      const response = await agent.delete(`/api/v2/fases-sucessionais/${faseSucessional.id}`).set(buildAuthHeader()).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/em uso|in use|uso/i)
    } finally {
      await knex('tombos').where({ fase_sucessional_id: faseSucessional.id }).delete()
      await knex('fase_sucessional').where({ id: faseSucessional.id }).delete()
    }
  })
})
