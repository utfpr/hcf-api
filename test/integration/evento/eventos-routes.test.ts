import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import {
  cleanupExpedicaoFixtures, ExpedicaoFixtures, seedExpedicaoFixtures
} from '../setup/seeds/expedicao.seed'

type ListaEventosResponse = {
  itens: Array<{ id: number }>
  total: number
  limite: number
  pagina: number
}

type EventoResponse = {
  id: number
  tipo: string
}

describe('Eventos routes', () => {
  const { agent, knex } = createTestApp()

  let fixtures: ExpedicaoFixtures
  let expedicaoId: number

  beforeAll(async () => {
    fixtures = await seedExpedicaoFixtures(knex)

    const [expedicao] = await knex('expedicoes')
      .insert({
        descricao: 'XEXP rotas eventos',
        data_inicio: '2026-02-14',
        data_fim: '2026-02-18',
        cidade_id: fixtures.cidades[0]
      })
      .returning<Array<{ id: number }>>(['id'])

    expedicaoId = expedicao.id
  })

  test('lista os eventos da expedição com paginação e ordenação estável', async () => {
    const capturadoEm = '2026-02-15T14:32:00.000Z'

    const inserted = await knex('eventos')
      .insert([
        {
          expedicao_id: expedicaoId,
          tipo: 'DIARIO',
          capturado_em: capturadoEm
        },
        {
          expedicao_id: expedicaoId,
          tipo: 'COLETA',
          capturado_em: capturadoEm
        }
      ])
      .returning<Array<{ id: number }>>(['id'])

    try {
      const response = await agent
        .get(`/api/v2/expedicoes/${expedicaoId}/eventos`)
        .expect(200)

      const body = response.body as ListaEventosResponse

      expect(body.total).toBe(2)
      expect(body.limite).toBe(20)
      expect(body.pagina).toBe(1)
      expect(body.itens.map(evento => evento.id))
        .toEqual([...inserted].map(evento => evento.id).sort((a, b) => b - a))
    } finally {
      await knex('eventos').whereIn('id', inserted.map(evento => evento.id)).delete()
    }
  })

  test('busca um evento pelo id', async () => {
    const [evento] = await knex('eventos')
      .insert({
        expedicao_id: expedicaoId,
        tipo: 'DIARIO',
        capturado_em: '2026-02-16T10:00:00.000Z'
      })
      .returning<Array<{ id: number }>>(['id'])

    try {
      const response = await agent
        .get(`/api/v2/eventos/${evento.id}`)
        .expect(200)

      const body = response.body as EventoResponse

      expect(body.id).toBe(evento.id)
      expect(body.tipo).toBe('DIARIO')
    } finally {
      await knex('eventos').where({ id: evento.id }).delete()
    }
  })

  afterAll(async () => {
    await knex('expedicoes').where({ id: expedicaoId }).delete()
    await cleanupExpedicaoFixtures(knex, fixtures)
    await knex.destroy()
  })
})
