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

describe('PUT /api/v2/solos/:soloId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('atualiza um solo existente', async () => {
    const prefix = `UPDSOL-${Date.now()}`
    const [solo] = await knex<Solo>('solos')
      .insert({ nome: `${prefix} Antigo` })
      .returning(['id', 'nome']) as Solo[]

    try {
      const response = await agent.put(`/api/v2/solos/${solo.id}`).set(buildAuthHeader()).send({ nome: `${prefix} Novo` }).expect(200)
      const body = response.body as Solo

      expect(body).toEqual({ id: solo.id, nome: `${prefix} Novo` })
    } finally {
      await knex('solos').where({ id: solo.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.put('/api/v2/solos/999999').set(buildAuthHeader()).send({ nome: 'Qualquer' }).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.put('/api/v2/solos/abc').set(buildAuthHeader()).send({ nome: 'Qualquer' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 409 para nome duplicado', async () => {
    const prefix = `DUPSOL-${Date.now()}`
    const [original] = await knex<Solo>('solos')
      .insert({ nome: `${prefix} Original` })
      .returning(['id', 'nome']) as Solo[]

    const [other] = await knex<Solo>('solos')
      .insert({ nome: `${prefix} Outro` })
      .returning(['id', 'nome']) as Solo[]

    try {
      const response = await agent.put(`/api/v2/solos/${other.id}`).set(buildAuthHeader()).send({ nome: original.nome }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('solos').whereIn('id', [original.id, other.id]).delete()
    }
  })

  test('retorna 409 para nome duplicado sem diferenciar maiúsculas e minúsculas', async () => {
    const prefix = `DUPSOLCASE-${Date.now()}`
    const [original] = await knex<Solo>('solos')
      .insert({ nome: `${prefix} Original` })
      .returning(['id', 'nome']) as Solo[]

    const [other] = await knex<Solo>('solos')
      .insert({ nome: `${prefix} Outro` })
      .returning(['id', 'nome']) as Solo[]

    try {
      const response = await agent.put(`/api/v2/solos/${other.id}`).set(buildAuthHeader()).send({ nome: original.nome.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('solos').whereIn('id', [original.id, other.id]).delete()
    }
  })
})
