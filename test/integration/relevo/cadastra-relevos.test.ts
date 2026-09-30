import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Relevo = { id: number; nome: string }

describe('POST /api/v2/relevos', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('cadastra um novo tipo de relevo', async () => {
    const nome = `plano-${Date.now()}`
    const response = await agent.post('/api/v2/relevos').send({ nome: ` ${nome} ` }).expect(201)
    const body = response.body as Relevo

    expect(body).toMatchObject({ nome })
    expect(body).toHaveProperty('id')

    await knex('relevos').where({ id: body.id }).delete()
  })

  test('retorna 400 quando o nome está vazio', async () => {
    const response = await agent.post('/api/v2/relevos').send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/vazio|empty/i)
  })

  test('retorna 409 quando o nome já existe ignorando maiúsculas e minúsculas', async () => {
    const nome = `plano-duplicado-${Date.now()}`
    await knex('relevos').insert({ nome })

    try {
      const response = await agent.post('/api/v2/relevos').send({ nome: nome.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|already exists/i)
    } finally {
      await knex('relevos').whereILike('nome', `${nome}%`).delete()
    }
  })
})
