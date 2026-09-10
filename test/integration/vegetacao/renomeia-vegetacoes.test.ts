import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Vegetacao = { id: number; nome: string }

const buildAuthHeader = () => {
  const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, process.env.JWT_SECRET ?? 'test-secret')
  return { Authorization: `Bearer ${token}` }
}

describe('PUT /api/v2/vegetacoes/:vegetacaoId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('atualiza uma vegetação existente', async () => {
    const prefix = `UPDVEG-${Date.now()}`
    const [vegetacao] = await knex<Vegetacao>('vegetacoes')
      .insert({ nome: `${prefix} Antiga` })
      .returning(['id', 'nome']) as Vegetacao[]

    try {
      const response = await agent.put(`/api/v2/vegetacoes/${vegetacao.id}`).set(buildAuthHeader()).send({ nome: `${prefix} Nova` }).expect(200)
      const body = response.body as Vegetacao

      expect(body).toEqual({ id: vegetacao.id, nome: `${prefix} Nova` })
    } finally {
      await knex('vegetacoes').where({ id: vegetacao.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.put('/api/v2/vegetacoes/999999').set(buildAuthHeader()).send({ nome: 'Qualquer' }).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.put('/api/v2/vegetacoes/abc').set(buildAuthHeader()).send({ nome: 'Qualquer' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 409 para nome duplicado', async () => {
    const prefix = `DUPUPD-${Date.now()}`
    const [original] = await knex<Vegetacao>('vegetacoes')
      .insert({ nome: `${prefix} Original` })
      .returning(['id', 'nome']) as Vegetacao[]

    const [other] = await knex<Vegetacao>('vegetacoes')
      .insert({ nome: `${prefix} Outro` })
      .returning(['id', 'nome']) as Vegetacao[]

    try {
      const response = await agent.put(`/api/v2/vegetacoes/${other.id}`).set(buildAuthHeader()).send({ nome: original.nome }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('vegetacoes').whereIn('id', [original.id, other.id]).delete()
    }
  })
})
