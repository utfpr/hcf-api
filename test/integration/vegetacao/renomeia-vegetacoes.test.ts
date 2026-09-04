import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Vegetacao = { id: number; nome: string }

describe('PUT /api/v2/vegetacoes/:vegetacaoId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('atualiza uma vegetação existente', async () => {
    const prefix = `UPDVEG-${Date.now()}`
    const [vegetacao] = await knex<Vegetacao>('vegetacoes')
      .insert({ nome: `${prefix} Antiga` })
      .returning(['id', 'nome']) as Vegetacao[]

    try {
      const response = await agent.put(`/api/v2/vegetacoes/${vegetacao.id}`).send({ nome: `${prefix} Nova` }).expect(200)
      const body = response.body as Vegetacao

      expect(body).toEqual({ id: vegetacao.id, nome: `${prefix} Nova` })
    } finally {
      await knex('vegetacoes').where({ id: vegetacao.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.put('/api/v2/vegetacoes/999999').send({ nome: 'Qualquer' }).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.put('/api/v2/vegetacoes/abc').send({ nome: 'Qualquer' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })
})
