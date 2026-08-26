import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Solo = { id: number; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v2/solos', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna a lista ordenada por id decrescente como padrão', async () => {
    const nomes = [
      'XSOL Arenoso',
      'XSOL Argiloso',
      'XSOL Pedregoso'
    ]

    const inserted = await knex('solos')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Solo[]>(returning)

    try {
      const response = await agent.get('/api/v2/solos').expect(200)
      const expected = [...inserted].sort((a, b) => b.id - a.id)
      expect(response.body).toEqual(expected)
    } finally {
      await knex('solos').whereIn('nome', nomes).delete()
    }
  })

  test('filtra por nome sem diferenciar maiúsculas e minúsculas', async () => {
    const nomes = [
      'XSOL Arenoso',
      'XSOL Argiloso',
      'XSOL Pedregoso'
    ]
    const inserted = await knex('solos')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Solo[]>(returning)

    try {
      const response = await agent.get('/api/v2/solos?nome=arenoso').expect(200)
      expect(response.body).toEqual(inserted.filter(item => item.nome === 'XSOL Arenoso'))
    } finally {
      await knex('solos').whereIn('nome', nomes).delete()
    }
  })

  test('aceita ordenação customizada por nome e id', async () => {
    const nomes = [
      'XSOL Z',
      'XSOL A',
      'XSOL M'
    ]
    const inserted = await knex('solos')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Solo[]>(returning)

    try {
      const byNameAsc = await agent.get('/api/v2/solos?order=nome:asc').expect(200)
      expect(byNameAsc.body).toEqual([...inserted].sort((a, b) => a.nome.localeCompare(b.nome)))

      const byIdAsc = await agent.get('/api/v2/solos?order=id:asc').expect(200)
      expect(byIdAsc.body).toEqual([...inserted].sort((a, b) => a.id - b.id))
    } finally {
      await knex('solos').whereIn('nome', nomes).delete()
    }
  })
})

describe('GET /api/v2/solos/:soloId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna o registro encontrado', async () => {
    const [solo] = await knex('solos')
      .insert({ nome: 'XSOL Solo Encontrado' })
      .returning<Solo[]>(returning)

    try {
      const response = await agent.get(`/api/v2/solos/${solo.id}`).expect(200)
      expect(response.body).toEqual({ id: solo.id, nome: solo.nome })
    } finally {
      await knex('solos').where({ id: solo.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.get('/api/v2/solos/999999').expect(404)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.error.message).toMatch(/não encontrado|not found|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.get('/api/v2/solos/abc').expect(400)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.error.message).toMatch(/inválido|invalid/i)
  })
})
