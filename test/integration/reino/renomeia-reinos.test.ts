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

type Reino = { id: number; nome: string }

const returning = ['id', 'nome'] as const

describe('PUT /api/v1/reinos/:reinoId', () => {
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

  test('renomeia um reino e retorna os dados atualizados', async () => {
    const [reino] = await knex('reinos')
      .insert({ nome: `XREI_RENOMEAR_${Date.now()}` })
      .returning<Reino[]>(returning)

    try {
      const nome = `XREI_RENOMEADO_${Date.now()}`
      const response = await agent.put(`/api/v1/reinos/${reino.id}`)
        .set(authHeader)
        .send({ nome: ` ${nome} ` })
        .expect(200)

      expect(response.body).toEqual({ id: String(reino.id), nome })
    } finally {
      await knex('reinos').where({ id: reino.id }).delete()
    }
  })

  test('rejeita requisição sem token', async () => {
    const response = await agent.put('/api/v1/reinos/1').send({ nome: 'Sem token' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized|obrigatório|sem permissão/i)
  })

  test('rejeita usuário sem permissão para renomear reinos', async () => {
    const usuario = await insertUsuarioComTipo(knex, 3)
    const token = jwt.sign(
      { id: usuario.id, tipo_usuario_id: 3 },
      process.env.JWT_SECRET as string
    )

    try {
      const response = await agent.put('/api/v1/reinos/1')
        .set({ Authorization: `Bearer ${token}` })
        .send({ nome: 'Sem permissão' })
        .expect(403)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/forbidden|sem permissão/i)
    } finally {
      await usuario.cleanup()
    }
  })

  test('retorna 400 para ID inválido', async () => {
    const response = await agent.put('/api/v1/reinos/abc').set(authHeader).send({ nome: 'Reino válido' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 404 para ID inexistente', async () => {
    const response = await agent.put('/api/v1/reinos/999999999').set(authHeader).send({ nome: 'Reino válido' }).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 quando o nome está vazio', async () => {
    const [reino] = await knex('reinos')
      .insert({ nome: `XREI_NOME_VAZIO_${Date.now()}` })
      .returning<Reino[]>(returning)

    try {
      const response = await agent.put(`/api/v1/reinos/${reino.id}`).set(authHeader).send({ nome: '   ' }).expect(400)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/vazio|empty/i)
    } finally {
      await knex('reinos').where({ id: reino.id }).delete()
    }
  })

  test('retorna 409 quando o novo nome já pertence a outro reino', async () => {
    const [reino] = await knex('reinos')
      .insert({ nome: `XREI_ORIGINAL_${Date.now()}` })
      .returning<Reino[]>(returning)
    const [outro] = await knex('reinos')
      .insert({ nome: `XREI_DUPLICADO_${Date.now()}` })
      .returning<Reino[]>(returning)

    try {
      const response = await agent.put(`/api/v1/reinos/${reino.id}`)
        .set(authHeader)
        .send({ nome: outro.nome.toUpperCase() })
        .expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|already exists/i)
    } finally {
      await knex('reinos').whereIn('id', [reino.id, outro.id]).delete()
    }
  })
})
