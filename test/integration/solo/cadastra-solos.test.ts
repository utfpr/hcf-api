import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Solo = { id: number; nome: string }

const TEST_JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret'
const buildAuthHeader = () => ({
  Authorization: `Bearer ${jwt.sign({ id: 1, tipo_usuario_id: 1 }, TEST_JWT_SECRET)}`
})

describe('POST /api/v2/solos', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('cadastra um solo com sucesso', async () => {
    const prefix = `CSOL-${Date.now()}`
    const nome = `${prefix} Arenoso`

    try {
      const response = await agent.post('/api/v2/solos').set(buildAuthHeader()).send({ nome }).expect(201)
      const body = response.body as Solo

      expect(body).toMatchObject({ nome })
      expect(Number(body.id)).toBeGreaterThan(0)

      await knex('solos').where({ id: Number(body.id) }).delete()
    } catch (error) {
      await knex('solos').where('nome', 'like', `${prefix}%`).delete()
      throw error
    }
  })

  test('retorna 400 quando o nome está vazio', async () => {
    const response = await agent.post('/api/v2/solos').set(buildAuthHeader()).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/vazio|empty|obrigat/i)
  })

  test('retorna 409 para nome duplicado', async () => {
    const prefix = `DUPSOL-${Date.now()}`
    const nome = `${prefix} Argiloso`

    await knex('solos').insert({ nome })

    try {
      const response = await agent.post('/api/v2/solos').set(buildAuthHeader()).send({ nome }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('solos').where({ nome }).delete()
    }
  })

  test('retorna 409 para nome duplicado sem diferenciar maiúsculas e minúsculas', async () => {
    const prefix = `DUPSOLCASE-${Date.now()}`
    const nome = `${prefix} Arenoso`

    await knex('solos').insert({ nome })

    try {
      const response = await agent.post('/api/v2/solos').set(buildAuthHeader()).send({ nome: nome.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('solos').where({ nome }).delete()
    }
  })
})
