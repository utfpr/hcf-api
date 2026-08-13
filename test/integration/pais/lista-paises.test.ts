import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Pais = { id: number; nome: string; sigla: string }

const returning = [
  'id',
  'nome',
  'sigla'
] as const

describe('GET /api/v1/paises', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna 200 com os países que correspondem ao filtro de nome, ordenados por nome', async () => {
    const inserted = await knex('paises')
      .insert([
        { nome: 'XPAI Argentina', sigla: 'XPAR' },
        { nome: 'XPAI Brasil', sigla: 'XPBR' }
      ])
      .returning<Pais[]>(returning)

    try {
      const response = await agent.get('/api/v1/paises?nome=XPAI').expect(200)
      expect(response.body).toEqual(inserted)
    } finally {
      await knex('paises').whereIn('sigla', ['XPAR', 'XPBR']).delete()
    }
  })

  test('filtra pelo parâmetro nome sem distinção entre maiúsculas e minúsculas', async () => {
    const [pais] = await knex('paises')
      .insert({ nome: 'XPCI Brasil', sigla: 'XPCB' })
      .returning<Pais[]>(returning)

    try {
      const response = await agent.get('/api/v1/paises?nome=xpci bra').expect(200)
      expect(response.body).toEqual([pais])
    } finally {
      await knex('paises').where({ sigla: 'XPCB' }).delete()
    }
  })

  test('retorna array vazio quando nenhum país corresponde ao filtro', async () => {
    const response = await agent.get('/api/v1/paises?nome=XNOMATCH').expect(200)
    expect(response.body).toEqual([])
  })
})
