import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { FaseSucessional } from '@/domain/faseSucessional/FaseSucessional'

import { createTestApp } from '../setup/app-factory'

const buildAuthHeader = (
  payload = { id: 1, tipo_usuario_id: 1 },
  secret = process.env.JWT_SECRET as string
) => ({
  Authorization: `Bearer ${jwt.sign(payload, secret)}`
})

describe('POST /api/v2/fases-sucessionais', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('cadastra uma fase sucessional com sucesso', async () => {
    const prefix = `CADFASE-${Date.now()}`
    const nome = `${prefix} Inicial`

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

  test('rejeita token ausente', async () => {
    const response = await agent.post('/api/v2/fases-sucessionais').send({ nome: 'Sem token' }).expect(403)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/Token de autenticação obrigatório|sem permissão/i)
  })

  test('rejeita token vazio', async () => {
    const response = await agent.post('/api/v2/fases-sucessionais').set({ Authorization: 'Bearer ' }).send({ nome: 'Token vazio' }).expect(403)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/Token de autenticação obrigatório|sem permissão/i)
  })

  test('rejeita usuário com papel fora do permitido', async () => {
    const response = await agent.post('/api/v2/fases-sucessionais').set(buildAuthHeader({ id: 1, tipo_usuario_id: 99 })).send({ nome: 'Sem permissão' }).expect(403)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/sem permissão|permissão/i)
  })

  test('rejeita token expirado', async () => {
    const token = jwt.sign(
      {
        id: 1,
        tipo_usuario_id: 1,
        exp: Math.floor(Date.now() / 1000) - 60
      },
      process.env.JWT_SECRET as string
    )
    const response = await agent.post('/api/v2/fases-sucessionais').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token expirado' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/token expirado|expirado/i)
  })

  test('rejeita token inválido', async () => {
    const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, 'segredo-diferente')
    const response = await agent.post('/api/v2/fases-sucessionais').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token inválido' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/token de autenticação inválido|inválido/i)
  })

  test('rejeita nome vazio', async () => {
    const response = await agent.post('/api/v2/fases-sucessionais').set(buildAuthHeader()).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não pode ser vazio|vazio/i)
  })

  test('retorna 409 quando o nome já existe ignorando maiúsculas e minúsculas', async () => {
    const nome = `XFAS_DUPLICADO_${Date.now()}`

    await knex('fase_sucessional').insert({ nome })

    try {
      const response = await agent.post('/api/v2/fases-sucessionais').set(buildAuthHeader()).send({ nome: nome.toLowerCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe uma fase sucessional com esse nome/i)
    } finally {
      await knex('fase_sucessional').where({ nome }).delete()
    }
  })
})
