import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Row = { id: number | string; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v1/familias/:familiaId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna a família encontrada com o reino', async () => {
    const [reinoRow] = await knex('reinos')
      .insert({ nome: `XFAM Reino ${Date.now()}` })
      .returning<Row[]>(returning)
    const [familiaRow] = await knex('familias')
      .insert({ nome: `XFAM Encontrada ${Date.now()}`, reino_id: reinoRow.id })
      .returning<Row[]>(returning)

    try {
      const response = await agent.get(`/api/v1/familias/${familiaRow.id}`).expect(200)
      expect(response.body).toEqual({
        id: Number(familiaRow.id),
        nome: familiaRow.nome,
        reino: { id: Number(reinoRow.id), nome: reinoRow.nome }
      })
    } finally {
      await knex('familias').where({ id: familiaRow.id }).delete()
      await knex('reinos').where({ id: reinoRow.id }).delete()
    }
  })

  test('retorna 404 para ID inexistente', async () => {
    const response = await agent.get('/api/v1/familias/999999999').expect(404)
    const body = response.body as { error: { message: string } }
    expect(body.error.message).toMatch(/não encontrad[oa]|not found/i)
  })

  test('retorna 400 para ID inválido', async () => {
    const response = await agent.get('/api/v1/familias/abc').expect(400)
    const body = response.body as { error: { message: string } }
    expect(body.error.message).toMatch(/inválido|invalid/i)
  })
})
