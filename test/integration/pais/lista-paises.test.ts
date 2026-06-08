import {
  beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { paises, seedPaises } from '../setup/seeds/paises.seed'

describe('GET /api/paises', () => {
  const { agent, knex } = createTestApp()

  beforeAll(async () => {
    await seedPaises(knex)
  })

  test('returns 200 with all countries ordered by nome', async () => {
    const response = await agent.get('/api/paises').expect(200)
    expect(response.body).toEqual([paises[1], paises[0]])
  })

  test('filters by nome param (case-insensitive)', async () => {
    const response = await agent.get('/api/paises?nome=bra').expect(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].sigla).toBe('BRA')
  })

  test('returns empty array when no match', async () => {
    const response = await agent.get('/api/paises?nome=zzz').expect(200)
    expect(response.body).toEqual([])
  })
})
