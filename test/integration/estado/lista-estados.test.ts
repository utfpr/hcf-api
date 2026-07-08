import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Pais = { id: number; sigla: string }
type Estado = { id: number; nome: string; sigla: string }

const returningPais = [
  'id',
  'sigla'
] as const

const returningEstado = [
  'id',
  'nome',
  'sigla'
] as const

describe('GET /api/v1/paises/:paisSigla/estados', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna 200 com os estados do país informado, ordenados por nome', async () => {
    const [pais] = await knex('paises')
      .insert({ nome: 'XEST Brasil', sigla: 'XEBR' })
      .returning<Pais[]>(returningPais)

    const estados = await knex('estados')
      .insert([
        {
          nome: 'Paraná', pais_id: pais.id, sigla: 'XEPR'
        },
        {
          nome: 'São Paulo', pais_id: pais.id, sigla: 'XESP'
        }
      ])
      .returning<Estado[]>(returningEstado)

    try {
      const response = await agent.get(`/api/v1/paises/${pais.sigla}/estados`).expect(200)
      expect(response.body).toEqual(estados)
    } finally {
      await knex('estados').whereIn('sigla', ['XEPR', 'XESP']).delete()
      await knex('paises').where({ sigla: 'XEBR' }).delete()
    }
  })

  test('retorna array vazio quando o país não possui estados cadastrados', async () => {
    const response = await agent.get('/api/v1/paises/XNOMATCH/estados').expect(200)
    expect(response.body).toEqual([])
  })
})
