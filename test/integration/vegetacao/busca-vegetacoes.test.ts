import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Vegetacao = { id: number; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v2/vegetacoes/:vegetacaoId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna o registro encontrado', async () => {
    const nome = `XVEG_BUSCA_${Date.now()}`
    const [vegetacao] = await knex('vegetacoes')
      .insert({ nome })
      .returning<Vegetacao[]>(returning)

    try {
      const response = await agent.get(`/api/v2/vegetacoes/${vegetacao.id}`).expect(200)
      expect(response.body).toEqual({ id: vegetacao.id, nome: vegetacao.nome })
    } finally {
      await knex('vegetacoes').where({ id: vegetacao.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.get('/api/v2/vegetacoes/999999').expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad[ao]|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.get('/api/v2/vegetacoes/abc').expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 400 para id negativo', async () => {
    const response = await agent.get('/api/v2/vegetacoes/-12').expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })
})
