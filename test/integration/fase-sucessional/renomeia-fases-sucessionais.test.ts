import jwt from 'jsonwebtoken'
import {
  afterAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

const buildAuthHeader = (
  payload = { id: 1, tipo_usuario_id: 1 },
  secret = process.env.JWT_SECRET as string
) => ({
  Authorization: `Bearer ${jwt.sign(payload, secret)}`
})

describe('PUT /api/v2/fases-sucessionais/:faseSucessionalId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('renomeia uma fase sucessional com sucesso', async () => {
    const nomeOriginal = `XFAS_RENOMEIA_${Date.now()}`
    const nomeNovo = `${nomeOriginal}_NOVO`
    const [faseSucessional] = await knex('fase_sucessional')
      .insert({ nome: nomeOriginal })
      .returning<{ id: number; nome: string }[]>(['id', 'nome'])

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

    const [faseA] = await knex('fase_sucessional').insert({ nome: nomeOriginal }).returning<{ id: number; nome: string }[]>(['id', 'nome'])
    const [faseB] = await knex('fase_sucessional').insert({ nome: nomeOutro }).returning<{ id: number; nome: string }[]>(['id', 'nome'])

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
    const response = await agent.put('/api/v2/fases-sucessionais/1').send({ nome: 'Sem token' }).expect(403)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/Token de autenticação obrigatório|sem permissão/i)
  })

  test('rejeita usuário com papel fora do permitido', async () => {
    const response = await agent.put('/api/v2/fases-sucessionais/1').set(buildAuthHeader({ id: 1, tipo_usuario_id: 99 })).send({ nome: 'Sem permissão' }).expect(403)
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
    const response = await agent.put('/api/v2/fases-sucessionais/1').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token expirado' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/token expirado|expirado/i)
  })

  test('rejeita token inválido', async () => {
    const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, 'segredo-diferente')
    const response = await agent.put('/api/v2/fases-sucessionais/1').set({ Authorization: `Bearer ${token}` }).send({ nome: 'Token inválido' }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/token de autenticação inválido|inválido/i)
  })
})
