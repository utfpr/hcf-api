import {
  beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { estados, seedEstados } from '../setup/seeds/estados.seed'

describe('GET /api/paises/:paisSigla/estados', () => {
  const { agent, knex } = createTestApp()

  beforeAll(async () => {
    await seedEstados(knex)
  })

  test('returns 200 with estados for the given country', async () => {
    const response = await agent.get('/api/paises/BRA/estados').expect(200)
    expect(response.body).toEqual([
      {
        id: estados[0].id,
        nome: estados[0].nome,
        sigla: estados[0].sigla
      },
      {
        id: estados[1].id,
        nome: estados[1].nome,
        sigla: estados[1].sigla
      }
    ])
  })

  test('returns empty array when country has no estados', async () => {
    const response = await agent.get('/api/paises/ZZZ/estados').expect(200)
    expect(response.body).toEqual([])
  })
})
