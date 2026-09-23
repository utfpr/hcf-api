import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type FaseSucessionalAttributes = { id: number; nome: string }

const buildAuthHeader = () => {
  const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, process.env.JWT_SECRET as string)
  return { Authorization: `Bearer ${token}` }
}

describe('PUT /api/v2/fases-sucessionais/:faseSucessionalId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('atualiza uma vegetação existente', async () => {
    const prefix = `UPDVEG-${Date.now()}`
    const [faseSucessional] = await knex<FaseSucessionalAttributes>('fase_sucessional')
      .insert({ nome: `${prefix} Antiga` })
      .returning(['id', 'nome']) as FaseSucessionalAttributes[]

    try {
      const response = await agent.put(`/api/v2/fases-sucessionais/${faseSucessional.id}`).set(buildAuthHeader()).send({ nome: `${prefix} Nova` }).expect(200)
      const body = response.body as FaseSucessionalAttributes

      expect(body).toEqual({ id: faseSucessional.id, nome: `${prefix} Nova` })
    } finally {
      await knex('fase_sucessional').where({ id: faseSucessional.id }).delete()
    }
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.put('/api/v2/fases-sucessionais/999999').set(buildAuthHeader()).send({ nome: 'Qualquer' }).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.put('/api/v2/fases-sucessionais/abc').set(buildAuthHeader()).send({ nome: 'Qualquer' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 409 para nome duplicado', async () => {
    const prefix = `DUPUPD-${Date.now()}`
    const [original] = await knex<FaseSucessionalAttributes>('fase_sucessional')
      .insert({ nome: `${prefix} Original` })
      .returning(['id', 'nome']) as FaseSucessionalAttributes[]

    const [other] = await knex<FaseSucessionalAttributes>('fase_sucessional')
      .insert({ nome: `${prefix} Outro` })
      .returning(['id', 'nome']) as FaseSucessionalAttributes[]

    try {
      const response = await agent.put(`/api/v2/fases-sucessionais/${other.id}`).set(buildAuthHeader()).send({ nome: original.nome }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('fase_sucessional').whereIn('id', [original.id, other.id]).delete()
    }
  })
})
