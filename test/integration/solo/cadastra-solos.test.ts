import jwt from 'jsonwebtoken'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createSoloAuth } from './soloAuth'

type Solo = { id: number; nome: string }

describe('POST /api/v2/solos', () => {
  const { agent, knex } = createTestApp()

  let auth: Awaited<ReturnType<typeof createSoloAuth>>

  beforeAll(async () => {
    auth = await createSoloAuth(knex)
  })

  afterAll(async () => {
    await auth?.cleanup()
    await knex.destroy()
  })

  test('cadastra um solo com sucesso', async () => {
    const prefix = `CSOL-${Date.now()}`
    const nome = `${prefix} Arenoso`

    try {
      const response = await agent.post('/api/v2/solos').set(auth.header).send({ nome }).expect(201)
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
    const response = await agent.post('/api/v2/solos').send({ nome: 'Sem token' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized/i)
  })

  test('rejeita token vazio', async () => {
    const response = await agent.post('/api/v2/solos').set({ Authorization: 'Bearer ' }).send({ nome: 'Token vazio' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized/i)
  })

  test('rejeita usuário cujo papel foi revogado no banco', async () => {
    await knex('tipos_usuarios').insert({ id: 99, tipo: 'Sem permissão' }).onConflict('id').ignore()
    await knex('usuarios').where({ id: auth.usuarioId }).update({ tipo_usuario_id: 99 })
    try {
      await agent.post('/api/v2/solos').set(auth.header).send({ nome: 'Sem permissão' }).expect(403)
      await agent.post('/api/v2/solos').set(auth.legacyHeader).send({ nome: 'Sem permissão' }).expect(403)
    } finally {
      await knex('usuarios').where({ id: auth.usuarioId }).update({ tipo_usuario_id: 1 })
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
    const response = await agent.post('/api/v2/solos').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token expirado' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/expired|expirado/i)
  })

  test('rejeita token inválido', async () => {
    const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, 'segredo-diferente')
    const response = await agent.post('/api/v2/solos').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token inválido' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized/i)
  })

  test('aceita token legado de um curador existente', async () => {
    const nome = `LEGACYSOL-${Date.now()}`
    try {
      await agent.post('/api/v2/solos').set(auth.legacyHeader).send({ nome }).expect(201)
    } finally {
      await knex('solos').where({ nome }).delete()
    }
  })

  test('rejeita sessão removida', async () => {
    const payload = jwt.decode(auth.header.Authorization.slice('Bearer '.length)) as { sid: string }
    const session = await knex('usuarios_sessoes').where({ id: payload.sid }).first()
    await knex('usuarios_sessoes').where({ id: payload.sid }).delete()
    try {
      await agent.post('/api/v2/solos').set(auth.header).send({ nome: 'Sessão revogada' }).expect(401)
    } finally {
      await knex('usuarios_sessoes').insert(session)
    }
  })

  test('retorna 400 quando o nome está vazio', async () => {
    const response = await agent.post('/api/v2/solos').set(auth.header).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/vazio|empty|obrigat/i)
  })

  test('retorna 409 para nome duplicado', async () => {
    const prefix = `DUPSOL-${Date.now()}`
    const nome = `${prefix} Argiloso`

    await knex('solos').insert({ nome })

    try {
      const response = await agent.post('/api/v2/solos').set(auth.header).send({ nome }).expect(409)
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
      const response = await agent.post('/api/v2/solos').set(auth.header).send({ nome: nome.toUpperCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe|duplic/i)
    } finally {
      await knex('solos').where({ nome }).delete()
    }
  })
})
