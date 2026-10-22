import jwt from 'jsonwebtoken'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth } from '../setup/curador-auth'
import { insertUsuarioComTipo } from '../setup/usuarios'

type Relevo = { id: string; nome: string }

describe('POST /api/v1/relevos', () => {
  const { agent, knex } = createTestApp()
  let authHeader: { Authorization: string }
  let cleanupAuth: () => Promise<void>

  beforeAll(async () => {
    const auth = await createCuradorAuth(knex)
    authHeader = auth.header
    cleanupAuth = auth.cleanup
  })

  afterAll(async () => {
    await cleanupAuth()
    await knex.destroy()
  })

  test('cadastra um novo tipo de relevo', async () => {
    const nome = `plano-${Date.now()}`
    const response = await agent.post('/api/v1/relevos').set(authHeader).send({ nome: ` ${nome} ` }).expect(201)
    const body = response.body as Relevo

    expect(body).toMatchObject({ nome })
    expect(body.id).toMatch(/^\d+$/)
    expect(BigInt(body.id)).toBeGreaterThan(0n)

    await knex('relevos').where({ id: body.id }).delete()
  })

  test('rejeita token ausente', async () => {
    const response = await agent.post('/api/v1/relevos').send({ nome: 'Sem token' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized|obrigatório|sem permissão/i)
  })

  test('rejeita token vazio', async () => {
    const response = await agent.post('/api/v1/relevos').set({ Authorization: 'Bearer ' }).send({ nome: 'Token vazio' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized|obrigatório|sem permissão/i)
  })

  test('rejeita usuário com papel fora do permitido', async () => {
    const usuario = await insertUsuarioComTipo(knex, 3)
    const token = jwt.sign(
      { id: usuario.id, tipo_usuario_id: 3 },
      process.env.JWT_SECRET as string
    )

    try {
      const response = await agent.post('/api/v1/relevos').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Sem permissão' }).expect(403)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/forbidden|sem permissão/i)
    } finally {
      await usuario.cleanup()
    }
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
    const response = await agent.post('/api/v1/relevos').set({ Authorization: `Bearer ${token}` }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized|expirado|expired/i)
  })

  test('rejeita token inválido', async () => {
    const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, 'segredo-diferente')
    const response = await agent.post('/api/v1/relevos').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token inválido' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized|inválido|invalid/i)
  })

  test('retorna 400 quando o nome está vazio', async () => {
    const response = await agent.post('/api/v1/relevos').set(authHeader).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/vazio|empty/i)
  })

  test('retorna 409 quando o nome já existe ignorando maiúsculas e minúsculas', async () => {
    const nome = `plano-duplicado-${Date.now()}`
    await knex('relevos').insert({ nome })

    try {
      const response = await agent.post('/api/v1/relevos').set(authHeader).send({ nome: nome.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|already exists/i)
    } finally {
      await knex('relevos').whereILike('nome', `${nome}%`).delete()
    }
  })
})
