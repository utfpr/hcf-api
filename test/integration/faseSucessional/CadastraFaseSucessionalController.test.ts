import jwt from 'jsonwebtoken'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from 'vitest'

import { FaseSucessional } from '@/domain/faseSucessional/FaseSucessional'

import { createTestApp } from '../setup/app-factory'
import { insertUsuarioComTipo } from '../setup/usuarios'

let writerId = 0
const buildAuthHeader = (
  payload: { id: number } = { id: writerId },
  secret = process.env.JWT_SECRET as string
) => ({
  Authorization: `Bearer ${jwt.sign(payload, secret)}`
})

describe('CadastraFaseSucessionalController', () => {
  const { agent, knex } = createTestApp()
  const cleanups: (() => Promise<void>)[] = []
  let outsiderId = 0

  beforeAll(async () => {
    const writer = await insertUsuarioComTipo(knex, 1)
    const outsider = await insertUsuarioComTipo(knex, 99)
    writerId = writer.id
    outsiderId = outsider.id
    cleanups.push(writer.cleanup, outsider.cleanup)
  })

  afterAll(async () => {
    for (const cleanup of cleanups) await cleanup()
    await knex.destroy()
  })

  test('cadastra uma fase sucessional com sucesso', async () => {
    const prefix = `CADFASE-${Date.now()}`
    const nome = `${prefix} Inicial`

    try {
      const response = await agent.post('/api/v1/fases-sucessionais').set(buildAuthHeader()).send({ nome }).expect(201)
      const body = response.body as FaseSucessional

      expect(body).toMatchObject({ nome })
      expect(body.id).toMatch(/^\d+$/)
      expect(BigInt(body.id as string)).toBeGreaterThan(0n)

      await knex('fase_sucessional').where({ id: body.id }).delete()
    } catch (error) {
      await knex('fase_sucessional').where('nome', 'like', `${prefix}%`).delete()
      throw error
    }
  })

  test('rejeita token ausente', async () => {
    const response = await agent.post('/api/v1/fases-sucessionais').send({ nome: 'Sem token' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized/i)
  })

  test('rejeita token vazio', async () => {
    const response = await agent.post('/api/v1/fases-sucessionais').set({ Authorization: 'Bearer ' }).send({ nome: 'Token vazio' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized/i)
  })

  test('rejeita usuário com papel fora do permitido', async () => {
    const response = await agent.post('/api/v1/fases-sucessionais').set(buildAuthHeader({ id: outsiderId })).send({ nome: 'Sem permissão' }).expect(403)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/forbidden/i)
  })

  test('rejeita token expirado', async () => {
    const token = jwt.sign(
      {
        id: writerId,
        exp: Math.floor(Date.now() / 1000) - 60
      },
      process.env.JWT_SECRET as string
    )
    const response = await agent.post('/api/v1/fases-sucessionais').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token expirado' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized|expired/i)
  })

  test('rejeita token inválido', async () => {
    const token = jwt.sign({ id: writerId }, 'segredo-diferente')
    const response = await agent.post('/api/v1/fases-sucessionais').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token inválido' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized/i)
  })

  test('rejeita nome vazio', async () => {
    const response = await agent.post('/api/v1/fases-sucessionais').set(buildAuthHeader()).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não pode ser vazio|vazio/i)
  })

  test('retorna 409 quando o nome já existe ignorando maiúsculas e minúsculas', async () => {
    const nome = `XFAS_DUPLICADO_${Date.now()}`

    await knex('fase_sucessional').insert({ nome })

    try {
      const response = await agent.post('/api/v1/fases-sucessionais').set(buildAuthHeader()).send({ nome: nome.toLowerCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe uma fase sucessional com esse nome/i)
    } finally {
      await knex('fase_sucessional').where({ nome }).delete()
    }
  })
})
