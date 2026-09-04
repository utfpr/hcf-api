import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Vegetacao = { id: number; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v2/vegetacoes', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna a lista ordenada por id decrescente como padrão dentro do prefixo do teste', async () => {
    const prefix = 'XVEG'
    const nomes = [
      `${prefix} Mata Atlântica`,
      `${prefix} Restinga`,
      `${prefix} Campo`
    ]

    const inserted = await knex('vegetacoes')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Vegetacao[]>(returning)

    try {
      const response = await agent.get(`/api/v2/vegetacoes?nome=${prefix}`).expect(200)
      const expected = [...inserted].sort((a, b) => b.id - a.id)
      expect(response.body).toEqual(expected)
    } finally {
      await knex('vegetacoes').whereIn('nome', nomes).delete()
    }
  })

  test('filtra por nome sem diferenciar maiúsculas e minúsculas', async () => {
    const prefix = 'XVEG'
    const nomes = [
      `${prefix} Floresta`,
      `${prefix} Cerrado`,
      `${prefix} Outros`
    ]
    const inserted = await knex('vegetacoes')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Vegetacao[]>(returning)

    try {
      const response = await agent.get(`/api/v2/vegetacoes?nome=${prefix} floresta`).expect(200)
      expect(response.body).toEqual(inserted.filter(item => item.nome === `${prefix} Floresta`))
    } finally {
      await knex('vegetacoes').whereIn('nome', nomes).delete()
    }
  })

  test('aceita ordenação customizada por nome e id', async () => {
    const prefix = 'XVEG'
    const nomes = [
      `${prefix} Z`,
      `${prefix} A`,
      `${prefix} M`
    ]
    const inserted = await knex('vegetacoes')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Vegetacao[]>(returning)

    try {
      const byNameAsc = await agent.get(`/api/v2/vegetacoes?nome=${prefix}&order=nome:asc`).expect(200)
      expect(byNameAsc.body).toEqual([...inserted].sort((a, b) => a.nome.localeCompare(b.nome)))

      const byIdAsc = await agent.get(`/api/v2/vegetacoes?nome=${prefix}&order=id:asc`).expect(200)
      expect(byIdAsc.body).toEqual([...inserted].sort((a, b) => a.id - b.id))
    } finally {
      await knex('vegetacoes').whereIn('nome', nomes).delete()
    }
  })

  test('retorna 400 quando a ordenação é inválida', async () => {
    const prefix = 'XVEG'
    const nomes = [
      `${prefix} Z`,
      `${prefix} A`,
      `${prefix} M`
    ]

    await knex('vegetacoes').insert(nomes.map(nome => ({ nome })))

    try {
      const response = await agent.get(`/api/v2/vegetacoes?nome=${prefix}&order=foo:bar`).expect(400)
      const body = response.body as { error: { message: string } }
      expect(body.error.message).toMatch(/inválido|invalid/i)
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
