import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Vegetacao = { id: number; nome: string }

describe('DELETE /api/v2/vegetacoes/:vegetacaoId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('remove uma vegetação sem dependências', async () => {
    const prefix = `DELVEG-${Date.now()}`
    const [vegetacao] = await knex<Vegetacao>('vegetacoes')
      .insert({ nome: `${prefix} Removível` })
      .returning(['id', 'nome']) as Vegetacao[]

    try {
      await agent.delete(`/api/v2/vegetacoes/${vegetacao.id}`).expect(204)
      const found = await knex('vegetacoes').where({ id: vegetacao.id }).first()
      expect(found).toBeUndefined()
    } finally {
      await knex('vegetacoes').where('nome', 'like', `${prefix}%`).delete()
    }
  })

  test('retorna 409 quando a vegetação está em uso em um tombo', async () => {
    const prefix = `USEVEG-${Date.now()}`
    const [vegetacao] = await knex<Vegetacao>('vegetacoes')
      .insert({ nome: `${prefix} Em Uso` })
      .returning(['id', 'nome']) as Vegetacao[]

    try {
      await knex('tombos').insert({
        hcf: 9000000000 + Date.now(),
        vegetacao_id: vegetacao.id,
        ativo: true,
        rascunho: false,
        created_at: new Date(),
        updated_at: new Date()
      })

      const response = await agent.delete(`/api/v2/vegetacoes/${vegetacao.id}`).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/em uso|in use|uso/i)
    } finally {
      await knex('tombos').where({ vegetacao_id: vegetacao.id }).delete()
      await knex('vegetacoes').where({ id: vegetacao.id }).delete()
    }
  })
})
