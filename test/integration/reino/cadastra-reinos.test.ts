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

type Reino = { id: string; nome: string }

describe('POST /api/v1/reinos', () => {
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

  test('cadastra um reino e remove espaços externos do nome', async () => {
    const nome = `XREI_CADASTRO_${Date.now()}`
    const response = await agent.post('/api/v1/reinos').set(authHeader).send({ nome: ` ${nome} ` }).expect(201)
    const body = response.body as Reino

    try {
      expect(body).toEqual({ id: expect.any(String), nome })
      expect(BigInt(body.id)).toBeGreaterThan(0n)
    } finally {
      await knex('reinos').where({ id: body.id }).delete()
    }
  })

  test('rejeita requisição sem token', async () => {
    const response = await agent.post('/api/v1/reinos').send({ nome: 'Sem token' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized|obrigatório|sem permissão/i)
  })

  test('rejeita usuário sem permissão para cadastrar reinos', async () => {
    const usuario = await insertUsuarioComTipo(knex, 3)
    const token = jwt.sign(
      { id: usuario.id, tipo_usuario_id: 3 },
      process.env.JWT_SECRET as string
    )

    try {
      const response = await agent.post('/api/v1/reinos')
        .set({ Authorization: `Bearer ${token}` })
        .send({ nome: 'Sem permissão' })
        .expect(403)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/forbidden|sem permissão/i)
    } finally {
      await usuario.cleanup()
    }
  })

  test('retorna 400 quando o nome está vazio', async () => {
    const response = await agent.post('/api/v1/reinos').set(authHeader).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/vazio|empty/i)
  })

  test('retorna 409 quando o nome já existe sem diferenciar maiúsculas e minúsculas', async () => {
    const nome = `XREI_DUPLICADO_${Date.now()}`
    const [reino] = await knex('reinos').insert({ nome }).returning<{ id: number }[]>('id')

    try {
      const response = await agent.post('/api/v1/reinos').set(authHeader).send({ nome: nome.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|already exists/i)
    } finally {
      await knex('reinos').where({ id: reino.id }).delete()
    }
  })
})
