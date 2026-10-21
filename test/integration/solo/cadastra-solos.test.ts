import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test,
  vi
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Solo = { id: number; nome: string }

const buildAuthHeader = (
  payload = { id: 1, tipo_usuario_id: 1 },
  secret = process.env.JWT_SECRET as string
) => ({
  Authorization: `Bearer ${jwt.sign(payload, secret)}`
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

  test('rejeita token ausente', async () => {
    const response = await agent.post('/api/v2/solos').send({ nome: 'Sem token' }).expect(403)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/Token de autenticação obrigatório|sem permissão/i)
  })

  test('rejeita token vazio', async () => {
    const response = await agent.post('/api/v2/solos').set({ Authorization: 'Bearer ' }).send({ nome: 'Token vazio' }).expect(403)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/Token de autenticação obrigatório|sem permissão/i)
  })

  test('rejeita usuário com papel fora do permitido', async () => {
    const response = await agent.post('/api/v2/solos').set(buildAuthHeader({ id: 1, tipo_usuario_id: 99 })).send({ nome: 'Sem permissão' }).expect(403)
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
    const response = await agent.post('/api/v2/solos').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token expirado' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/token expirado|expirado/i)
  })

  test('rejeita token inválido', async () => {
    const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, 'segredo-diferente')
    const response = await agent.post('/api/v2/solos').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token inválido' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/token de autenticação inválido|invalid/i)
  })

  test('rejeita quando JWT_SECRET não está configurado', async () => {
    const originalSecret = process.env.JWT_SECRET
    vi.resetModules()
    delete process.env.JWT_SECRET

    try {
      const { ExigePermissaoEscritaSolo } = await import('@/application/solo/ExigePermissaoEscritaSolo')
      const middleware = new ExigePermissaoEscritaSolo()
      const response = await middleware.handle(
        {
          method: 'post',
          path: '/api/v2/solos',
          headers: {
            Authorization: 'Bearer qualquer-token',
            'Content-Length': 0,
            'Content-Type': 'application/json'
          },
          params: {},
          body: { nome: 'Sem secret' }
        },
        () => Promise.resolve({ statusCode: 200, body: {} })
      )

      expect(response).toMatchObject({
        statusCode: 401,
        message: expect.stringMatching(/token de autenticação inválido|invalid/i)
      })
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
