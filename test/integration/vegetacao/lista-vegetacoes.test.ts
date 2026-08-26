import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Vegetacao = { id: number; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v2/vegetacoes', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna a lista ordenada por id decrescente como padrão', async () => {
    const nomes = [
      'XVEG Mata Atlântica',
      'XVEG Restinga',
      'XVEG Campo'
    ]

    const inserted = await knex('vegetacoes')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Vegetacao[]>(returning)

    try {
      const response = await agent.get('/api/v2/vegetacoes').expect(200)
      const expected = [...inserted].sort((a, b) => b.id - a.id)
      expect(response.body).toEqual(expected)
    } finally {
      await knex('vegetacoes').whereIn('nome', nomes).delete()
    }
  })

  test('filtra por nome sem diferenciar maiúsculas e minúsculas', async () => {
    const nomes = [
      'XVEG Floresta',
      'XVEG Cerrado',
      'XVEG Outros'
    ]
    const inserted = await knex('vegetacoes')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Vegetacao[]>(returning)

    try {
      const response = await agent.get('/api/v2/vegetacoes?nome=floresta').expect(200)
      expect(response.body).toEqual(inserted.filter(item => item.nome === 'XVEG Floresta'))
    } finally {
      await knex('vegetacoes').whereIn('nome', nomes).delete()
    }
  })

  test('aceita ordenação customizada por nome e id', async () => {
    const nomes = [
      'XVEG Z',
      'XVEG A',
      'XVEG M'
    ]
    const inserted = await knex('vegetacoes')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Vegetacao[]>(returning)

    try {
      const byNameAsc = await agent.get('/api/v2/vegetacoes?order=nome:asc').expect(200)
      expect(byNameAsc.body).toEqual([...inserted].sort((a, b) => a.nome.localeCompare(b.nome)))

      const byIdAsc = await agent.get('/api/v2/vegetacoes?order=id:asc').expect(200)
      expect(byIdAsc.body).toEqual([...inserted].sort((a, b) => a.id - b.id))
    } finally {
      await knex('vegetacoes').whereIn('nome', nomes).delete()
    }
  })
})

describe('GET /api/v2/vegetacoes/:vegetacaoId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna o registro encontrado', async () => {
    const [vegetacao] = await knex('vegetacoes')
      .insert({ nome: 'XVEG Vegetação Encontrada' })
      .returning<Vegetacao[]>(returning)

    try {
      const response = await agent.get(`/api/v2/vegetacoes/${vegetacao.id}`).expect(200)
      expect(response.body).toEqual({ id: vegetacao.id, nome: vegetacao.nome })
    } finally {
      await knex('vegetacoes').where({ id: vegetacao.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.get('/api/v2/vegetacoes/999999').expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad[ao]|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.get('/api/v2/vegetacoes/abc').expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })
})
