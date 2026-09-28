import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Relevo = { id: number; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v2/relevos/:relevoId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna o registro encontrado', async () => {
    const [relevo] = await knex('relevos')
      .insert({ nome: 'XREL Relevo Encontrado' })
      .returning<Relevo[]>(returning)

    try {
      const response = await agent.get(`/api/v2/relevos/${relevo.id}`).expect(200)
      expect(response.body).toEqual({ id: relevo.id, nome: relevo.nome })
    } finally {
      await knex('relevos').where({ id: relevo.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.get('/api/v2/relevos/999999').expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad[ao]|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.get('/api/v2/relevos/abc').expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })
})
