import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Vegetacao = { id: number; nome: string }

const buildAuthHeader = (
  payload = { id: 1, tipo_usuario_id: 1 },
  secret = process.env.JWT_SECRET as string
) => ({
  Authorization: `Bearer ${jwt.sign(payload, secret)}`
})

describe('POST /api/v2/vegetacoes', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('cadastra uma vegetação com sucesso', async () => {
    const prefix = `CADVEG-${Date.now()}`
    const nome = `${prefix} Mata Atlântica`

    try {
      const response = await agent.post('/api/v2/vegetacoes').set(buildAuthHeader()).send({ nome }).expect(201)
      const body = response.body as Vegetacao

      expect(body).toMatchObject({ nome })
      expect(Number(body.id)).toBeGreaterThan(0)

      await knex('vegetacoes').where({ id: Number(body.id) }).delete()
    } catch (error) {
      await knex('vegetacoes').where('nome', 'like', `${prefix}%`).delete()
      throw error
    }
  })

  test('retorna 400 quando o nome está vazio', async () => {
    const response = await agent.post('/api/v2/vegetacoes').set(buildAuthHeader()).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/vazio|empty|obrigat/i)
  })

  test('retorna 409 para nome duplicado sem diferenciar maiúsculas e minúsculas', async () => {
    const prefix = `DUPVEG-${Date.now()}`
    const nome = `${prefix} Cerrado`

    await knex('vegetacoes').insert({ nome })

    try {
      const response = await agent.post('/api/v2/vegetacoes').set(buildAuthHeader()).send({ nome: nome.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('vegetacoes').where({ nome }).delete()
    }
  })
})
