import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { cleanupPaises, seedPaises } from '../setup/seeds/paises.seed'

describe('GET /api/paises — per-test data example', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('finds the country that was just inserted', async () => {
    const [pais] = await knex('paises')
      .insert({ nome: 'XPIT País Exemplo', sigla: 'XPIT' })
      .returning<Array<{ id: number; nome: string; sigla: string }>>([
        'id',
        'nome',
        'sigla'
      ])

    try {
      const response = await agent.get('/api/paises?nome=XPIT').expect(200)
      expect(response.body).toEqual([pais])
    } finally {
      await knex('paises').where({ id: pais.id }).delete()
    }
  })

  test('returns empty after the previous test cleaned up its data', async () => {
    // Because the test above deleted its row in the finally block, there is
    // nothing left — even if tests happen to run sequentially.
    const response = await agent.get('/api/paises?nome=XPIT').expect(200)
    expect(response.body).toEqual([])
  })
})

describe('GET /api/paises', () => {
  const { agent, knex } = createTestApp()
  let seeded: Array<{ id: number; nome: string; sigla: string }>

  beforeAll(async () => {
    seeded = await seedPaises(knex)
  })

  afterAll(async () => {
    await cleanupPaises(knex)
    await knex.destroy()
  })

  test('returns 200 with countries matching nome filter, ordered by nome', async () => {
    // Filter by the unique prefix owned by this test file to avoid touching other rows
    const response = await agent.get('/api/paises?nome=XPAI').expect(200)
    // seeded[0] = XPAI Argentina, seeded[1] = XPAI Brasil (insertion order matches alpha order)
    expect(response.body).toEqual([seeded[0], seeded[1]])
  })

  test('filters by nome param (case-insensitive)', async () => {
    const response = await agent.get('/api/paises?nome=xpai bra').expect(200)
    expect(response.body).toHaveLength(1)
    expect((response.body as Array<{ sigla: string }>)[0].sigla).toBe('XPBR')
  })

  test('returns empty array when no match', async () => {
    const response = await agent.get('/api/paises?nome=zzz').expect(200)
    expect(response.body).toEqual([])
  })
})
