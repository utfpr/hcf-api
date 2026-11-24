import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Reino = { id: number | string; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v1/reinos/:reinoId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna o reino encontrado', async () => {
    const [reino] = await knex('reinos')
      .insert({ nome: `XREI Encontrado ${Date.now()}` })
      .returning<Reino[]>(returning)

    try {
      const response = await agent.get(`/api/v1/reinos/${reino.id}`).expect(200)
      expect(response.body).toEqual({ id: reino.id, nome: reino.nome })
    } finally {
      await knex('reinos').where({ id: reino.id }).delete()
    }
  })

  test('retorna 404 para ID inexistente', async () => {
    const response = await agent.get('/api/v1/reinos/999999999').expect(404)
    const body = response.body as { error: { message: string } }
    expect(body.error.message).toMatch(/não encontrad[oa]|not found/i)
  })

  test('retorna 400 para ID inválido', async () => {
    const response = await agent.get('/api/v1/reinos/abc').expect(400)
    const body = response.body as { error: { message: string } }
    expect(body.error.message).toMatch(/inválido|invalid/i)
  })
})
