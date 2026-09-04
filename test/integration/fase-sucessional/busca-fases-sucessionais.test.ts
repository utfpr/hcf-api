import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type FaseSucessional = { id: number; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v2/fases-sucessionais/:faseSucessionalId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna o registro encontrado', async () => {
    const [faseSucessional] = await knex('fase_sucessional')
      .insert({ nome: 'XFAS Fase Encontrada' })
      .returning<FaseSucessional[]>(returning)

    try {
      const response = await agent.get(`/api/v2/fases-sucessionais/${faseSucessional.id}`).expect(200)
      expect(response.body).toEqual({ id: faseSucessional.id, nome: faseSucessional.nome })
    } finally {
      await knex('fase_sucessional').where({ id: faseSucessional.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.get('/api/v2/fases-sucessionais/999999').expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad[ao]|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.get('/api/v2/fases-sucessionais/abc').expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.get('/api/v2/fases-sucessionais/-12').expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })
})
