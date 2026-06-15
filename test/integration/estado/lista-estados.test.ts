import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { cleanupEstados, seedEstados } from '../setup/seeds/estados.seed'

describe('GET /api/paises/:paisSigla/estados', () => {
  const { agent, knex } = createTestApp()
  let seeded: Array<{ id: number; nome: string; sigla: string }>

  beforeAll(async () => {
    seeded = await seedEstados(knex)
  })

  afterAll(async () => {
    await cleanupEstados(knex)
    await knex.destroy()
  })

  test('returns 200 with estados for the given country', async () => {
    // XEST_BRA owns seeded[0] (Paraná/XEPR) and seeded[1] (São Paulo/XESP)
    const response = await agent.get('/api/paises/XEBR/estados').expect(200)
    expect(response.body).toEqual([
      {
        id: seeded[0].id, nome: seeded[0].nome, sigla: seeded[0].sigla
      },
      {
        id: seeded[1].id, nome: seeded[1].nome, sigla: seeded[1].sigla
      }
    ])
  })

  test('returns empty array when country has no estados', async () => {
    const response = await agent.get('/api/paises/ZZZ/estados').expect(200)
    expect(response.body).toEqual([])
  })
})
