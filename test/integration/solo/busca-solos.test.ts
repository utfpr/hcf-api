import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Solo = { id: number; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v2/solos/:soloId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna o registro encontrado', async () => {
    const [solo] = await knex('solos')
      .insert({ nome: 'XSOL Solo Encontrado' })
      .returning<Solo[]>(returning)

    try {
      const response = await agent.get(`/api/v2/solos/${solo.id}`).expect(200)
      expect(response.body).toEqual({ id: solo.id, nome: solo.nome })
    } finally {
      await knex('solos').where({ id: solo.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.get('/api/v2/solos/999999').expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad[ao]|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.get('/api/v2/solos/abc').expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })
})
