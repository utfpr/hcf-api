import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test,
  vi
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Relevo = { id: number; nome: string }

const buildAuthHeader = (
  payload = { id: 1, tipo_usuario_id: 1 },
  secret = process.env.JWT_SECRET as string
) => ({
  Authorization: `Bearer ${jwt.sign(payload, secret)}`
})

describe('POST /api/v2/relevos', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('cadastra um novo tipo de relevo', async () => {
    const nome = `plano-${Date.now()}`
    const response = await agent.post('/api/v2/relevos').set(buildAuthHeader()).send({ nome: ` ${nome} ` }).expect(201)
    const body = response.body as Relevo

    expect(body).toMatchObject({ nome })
    expect(body).toHaveProperty('id')

    await knex('relevos').where({ id: body.id }).delete()
  })

  test('rejeita token ausente', async () => {
    const response = await agent.post('/api/v2/relevos').send({ nome: 'Sem token' }).expect(403)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/Token de autenticação obrigatório|sem permissão/i)
  })

  test('rejeita token vazio', async () => {
    const response = await agent.post('/api/v2/relevos').set({ Authorization: 'Bearer ' }).send({ nome: 'Token vazio' }).expect(403)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/Token de autenticação obrigatório|sem permissão/i)
  })

  test('rejeita usuário com papel fora do permitido', async () => {
    const response = await agent.post('/api/v2/relevos').set(buildAuthHeader({ id: 1, tipo_usuario_id: 99 })).send({ nome: 'Sem permissão' }).expect(403)
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
    const response = await agent.post('/api/v2/relevos').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token expirado' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/token expirado|expirado/i)
  })

  test('rejeita token inválido', async () => {
    const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, 'segredo-diferente')
    const response = await agent.post('/api/v2/relevos').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token inválido' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/token de autenticação inválido|invalid/i)
  })

  test('rejeita quando JWT_SECRET não está configurado', async () => {
    const originalSecret = process.env.JWT_SECRET
    vi.resetModules()
    delete process.env.JWT_SECRET

    try {
      const { ExigePermissaoEscritaRelevo } = await import('@/application/relevo/ExigePermissaoEscritaRelevo')
      const middleware = new ExigePermissaoEscritaRelevo()
      const response = await middleware.handle(
        {
          method: 'post',
          path: '/api/v2/relevos',
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
    const response = await agent.post('/api/v2/relevos').set(buildAuthHeader()).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/vazio|empty/i)
  })

  test('retorna 409 quando o nome já existe ignorando maiúsculas e minúsculas', async () => {
    const nome = `plano-duplicado-${Date.now()}`
    await knex('relevos').insert({ nome })

    try {
      const response = await agent.post('/api/v2/relevos').set(buildAuthHeader()).send({ nome: nome.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|already exists/i)
    } finally {
      await knex('relevos').whereILike('nome', `${nome}%`).delete()
    }
  })
})
