import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test,
  vi
} from 'vitest'

import { FaseSucessional } from '@/domain/faseSucessional/FaseSucessional'

import { createTestApp } from '../setup/app-factory'

const buildAuthHeader = () => {
  const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, process.env.JWT_SECRET as string)
  return { Authorization: `Bearer ${token}` }
}

describe('POST /api/v2/vegetacoes', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('cadastra uma vegetação com sucesso', async () => {
    const prefix = `CADVEG-${Date.now()}`
    const nome = `${prefix} Mata Atlântica`

    try {
      const response = await agent.post('/api/v2/fases-sucessionais').set(buildAuthHeader()).send({ nome }).expect(201)
      const body = response.body as FaseSucessional

      expect(body).toMatchObject({ nome })
      expect(Number(body.id)).toBeGreaterThan(0)

      await knex('fase_sucessional').where({ id: Number(body.id) }).delete()
    } catch (error) {
      await knex('fase_sucessional').where('nome', 'like', `${prefix}%`).delete()
      throw error
    }
  })

  test('rejeita token assinado com segredo de teste quando o JWT_SECRET não está configurado', async () => {
    const originalSecret = process.env.JWT_SECRET
    vi.resetModules()
    delete process.env.JWT_SECRET

    try {
      const { createTestApp } = await import('../setup/app-factory')
      const { agent: isolatedAgent, knex: isolatedKnex } = createTestApp()
      const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, 'test-secret')
      const response = await isolatedAgent.post('/api/v2/fases-sucessionais').set({ Authorization: `Bearer ${token}` }).send({ nome: 'NOME SEM SECRET' }).expect(401)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/token de autenticação inválido|token expirado|invalid/i)
      await isolatedKnex.destroy()
    } finally {
      if (originalSecret === undefined) {
        delete process.env.JWT_SECRET
      } else {
        process.env.JWT_SECRET = originalSecret
      }
      vi.resetModules()
    }
  })

  test('retorna 400 quando o nome está vazio', async () => {
    const response = await agent.post('/api/v2/fases-sucessionais').set(buildAuthHeader()).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/vazio|empty|obrigat/i)
  })

  test('retorna 409 para nome duplicado', async () => {
    const prefix = `DUPVEG-${Date.now()}`
    const nome = `${prefix} Cerrado`

    await knex('fase_sucessional').insert({ nome })

    try {
      const response = await agent.post('/api/v2/fases-sucessionais').set(buildAuthHeader()).send({ nome }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('fase_sucessional').where({ nome }).delete()
    }
  })
})
