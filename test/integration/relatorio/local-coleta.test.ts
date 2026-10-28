import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth } from '../setup/curador-auth'

describe('Relatório de locais de coleta', () => {
  const { agent, knex } = createTestApp()
  let authHeader: { Authorization: string }
  let cleanupAuth: () => Promise<void>

  beforeAll(async () => {
    const auth = await createCuradorAuth(knex)
    authHeader = auth.header
    cleanupAuth = auth.cleanup
  })

  afterAll(async () => {
    await cleanupAuth()
    await knex.destroy()
  })

  test('retorna resultado vazio quando não há filtros', async () => {
    const response = await agent
      .get('/api/relatorio/local-coleta')
      .set(authHeader)
      .expect(200)

    expect(response.body.metadados.total).toBe(0)
    expect(response.body.resultado).toEqual({
      locais: [],
      quantidadeTotal: 0
    })
  })
})
