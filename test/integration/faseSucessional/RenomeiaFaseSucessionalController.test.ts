import jwt from 'jsonwebtoken'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { insertUsuarioComTipo } from '../setup/usuarios'

let writerId = 0
const buildAuthHeader = (
  payload: { id: number } = { id: writerId },
  secret = process.env.JWT_SECRET as string
) => ({
  Authorization: `Bearer ${jwt.sign(payload, secret)}`
})

describe('RenomeiaFaseSucessionalController', () => {
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

  test('renomeia uma fase sucessional com sucesso', async () => {
    const nomeOriginal = `XFAS_RENOMEIA_${Date.now()}`
    const nomeNovo = `${nomeOriginal}_NOVO`
    const [faseSucessional] = await knex('fase_sucessional')
      .insert({ nome: nomeOriginal })
      .returning<{ id: string; nome: string }[]>(['id', 'nome'])

    try {
      const response = await agent.put(`/api/v2/fases-sucessionais/${faseSucessional.id}`).set(buildAuthHeader()).send({ nome: nomeNovo }).expect(200)
      expect(response.body).toMatchObject({ id: faseSucessional.id, nome: nomeNovo })
    } finally {
      await knex('fase_sucessional').where({ id: faseSucessional.id }).delete()
    }
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.put('/api/v2/fases-sucessionais/abc').set(buildAuthHeader()).send({ nome: 'Nome válido' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 400 para nome vazio', async () => {
    const response = await agent.put('/api/v2/fases-sucessionais/1').set(buildAuthHeader()).send({ nome: '   ' }).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não pode ser vazio|vazio/i)
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.put('/api/v2/fases-sucessionais/999999').set(buildAuthHeader()).send({ nome: 'Nome inexistente' }).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrada|not found/i)
  })

  test('retorna 409 quando o nome já existe em outra linha', async () => {
    const nomeOriginal = `XFAS_RENOMEIA_DUP_${Date.now()}`
    const nomeOutro = `${nomeOriginal}_OUTRO`

    const [faseA] = await knex('fase_sucessional').insert({ nome: nomeOriginal }).returning<{ id: string; nome: string }[]>(['id', 'nome'])
    const [faseB] = await knex('fase_sucessional').insert({ nome: nomeOutro }).returning<{ id: string; nome: string }[]>(['id', 'nome'])

    try {
      const response = await agent.put(`/api/v2/fases-sucessionais/${faseA.id}`).set(buildAuthHeader()).send({ nome: nomeOutro.toLowerCase() }).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/já existe uma fase sucessional com esse nome/i)
    } finally {
      await knex('fase_sucessional').where({ id: faseA.id }).delete()
      await knex('fase_sucessional').where({ id: faseB.id }).delete()
    }
  })

  test('rejeita token ausente', async () => {
    const response = await agent.put('/api/v2/fases-sucessionais/1').send({ nome: 'Sem token' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized/i)
  })

  test('rejeita usuário com papel fora do permitido', async () => {
    const response = await agent.put('/api/v2/fases-sucessionais/1').set(buildAuthHeader({ id: outsiderId })).send({ nome: 'Sem permissão' }).expect(403)
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
    const response = await agent.put('/api/v2/fases-sucessionais/1').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token expirado' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized|expired/i)
  })

  test('rejeita token inválido', async () => {
    const token = jwt.sign({ id: writerId }, 'segredo-diferente')
    const response = await agent.put('/api/v2/fases-sucessionais/1').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token inválido' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized/i)
  })
})
