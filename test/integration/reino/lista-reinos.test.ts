import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Reino = { id: number | string; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v1/reinos', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('lista reinos por nome e usa id decrescente como ordenação padrão', async () => {
    const prefix = `XREI-${Date.now()}`
    const nomes = [
      `${prefix} Plantae`,
      `${prefix} Animalia`,
      `${prefix} Fungi`
    ]
    const inserted = await knex('reinos')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Reino[]>(returning)

    try {
      const response = await agent.get(`/api/v1/reinos?nome=${prefix}`).expect(200)
      const expected = [...inserted].sort((a, b) => Number(b.id) - Number(a.id))
      expect(response.body).toEqual(expected)
    } finally {
      await knex('reinos').whereIn('nome', nomes).delete()
    }
  })

  test('filtra por nome sem diferenciar maiúsculas e minúsculas', async () => {
    const prefix = `XREI-${Date.now()}`
    const nome = `${prefix} Plantae`
    const [reino] = await knex('reinos')
      .insert({ nome })
      .returning<Reino[]>(returning)

    try {
      const filtro = encodeURIComponent(`${prefix.toLowerCase()} plantae`)
      const response = await agent.get(`/api/v1/reinos?nome=${filtro}`).expect(200)
      expect(response.body).toEqual([reino])
    } finally {
      await knex('reinos').where({ id: reino.id }).delete()
    }
  })

  test('aceita ordenação customizada por nome e id', async () => {
    const prefix = `XREI-${Date.now()}`
    const nomes = [
      `${prefix} Z`,
      `${prefix} A`,
      `${prefix} M`
    ]
    const inserted = await knex('reinos')
      .insert(nomes.map(nome => ({ nome })))
      .returning<Reino[]>(returning)

    try {
      const byNameAsc = await agent.get(`/api/v1/reinos?nome=${prefix}&order=nome:asc`).expect(200)
      expect(byNameAsc.body).toEqual([...inserted].sort((a, b) => a.nome.localeCompare(b.nome)))

      const byNameDesc = await agent.get(`/api/v1/reinos?nome=${prefix}&order=nome:desc`).expect(200)
      expect(byNameDesc.body).toEqual([...inserted].sort((a, b) => b.nome.localeCompare(a.nome)))

      const byIdAsc = await agent.get(`/api/v1/reinos?nome=${prefix}&order=id:asc`).expect(200)
      expect(byIdAsc.body).toEqual([...inserted].sort((a, b) => Number(a.id) - Number(b.id)))

      const byIdDesc = await agent.get(`/api/v1/reinos?nome=${prefix}&order=id:desc`).expect(200)
      expect(byIdDesc.body).toEqual([...inserted].sort((a, b) => Number(b.id) - Number(a.id)))
    } finally {
      await knex('reinos').whereIn('nome', nomes).delete()
    }
  })

  test('retorna 400 quando a ordenação é inválida', async () => {
    const response = await agent.get('/api/v1/reinos?order=foo:bar').expect(400)
    const body = response.body as { error: { message: string } }
    expect(body.error.message).toMatch(/inválido|invalid/i)
  })
})
