import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Relevo = { id: number; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v2/relevos', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna a lista ordenada por id decrescente como padrão', async () => {
    const nomes = [
      'XREL Plano',
      'XREL Inclinado',
      'XREL Ondulado'
    ]

    const inserted = await knex('relevos')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Relevo[]>(returning)

    try {
      const response = await agent.get('/api/v2/relevos').expect(200)
      const expected = [...inserted].sort((a, b) => b.id - a.id)
      expect(response.body).toEqual(expected)
    } finally {
      await knex('relevos').whereIn('nome', nomes).delete()
    }
  })

  test('filtra por nome sem diferenciar maiúsculas e minúsculas', async () => {
    const nomes = [
      'XREL Plano',
      'XREL Inclinado',
      'XREL Ondulado'
    ]

    const inserted = await knex('relevos')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Relevo[]>(returning)

    try {
      const response = await agent.get('/api/v2/relevos?nome=plano').expect(200)
      expect(response.body).toEqual(inserted.filter(item => item.nome === 'XREL Plano'))
    } finally {
      await knex('relevos').whereIn('nome', nomes).delete()
    }
  })

  test('aceita ordenação customizada por nome e id', async () => {
    const nomes = [
      'XREL Z',
      'XREL A',
      'XREL M'
    ]

    const inserted = await knex('relevos')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Relevo[]>(returning)

    try {
      const byNameAsc = await agent.get('/api/v2/relevos?order=nome:asc').expect(200)
      expect(byNameAsc.body).toEqual([...inserted].sort((a, b) => a.nome.localeCompare(b.nome)))

      const byIdAsc = await agent.get('/api/v2/relevos?order=id:asc').expect(200)
      expect(byIdAsc.body).toEqual([...inserted].sort((a, b) => a.id - b.id))
    } finally {
      await knex('relevos').whereIn('nome', nomes).delete()
    }
  })
})

describe('GET /api/v2/relevos/:relevoId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna o registro encontrado', async () => {
    const [relevo] = await knex('relevos')
      .insert({ nome: 'XREL Relevo Encontrado' })
      .returning<Relevo[]>(returning)

    try {
      const response = await agent.get(`/api/v2/relevos/${relevo.id}`).expect(200)
      expect(response.body).toEqual({ id: relevo.id, nome: relevo.nome })
    } finally {
      await knex('relevos').where({ id: relevo.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.get('/api/v2/relevos/999999').expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad[ao]|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.get('/api/v2/relevos/abc').expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })
})
