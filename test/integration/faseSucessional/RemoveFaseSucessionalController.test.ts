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

describe('RemoveFaseSucessionalController', () => {
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

  test('remove uma fase sucessional com sucesso', async () => {
    const nome = `XFAS_REMOVE_${Date.now()}`
    const [faseSucessional] = await knex('fase_sucessional')
      .insert({ nome })
      .returning<{ id: string; nome: string }[]>(['id', 'nome'])

    const response = await agent.delete(`/api/v1/fases-sucessionais/${faseSucessional.id}`).set(buildAuthHeader()).expect(204)
    expect(response.text).toBe('')
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.delete('/api/v1/fases-sucessionais/abc').set(buildAuthHeader()).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.delete('/api/v1/fases-sucessionais/999999').set(buildAuthHeader()).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrada|not found/i)
  })

  test('retorna 409 quando a fase ainda está em uso em tombos ou locais de coleta', async () => {
    const nome = `XFAS_EM_USO_${Date.now()}`
    const [faseSucessional] = await knex('fase_sucessional').insert({ nome }).returning<{ id: string; nome: string }[]>(['id', 'nome'])

    try {
      await knex('tombos').insert({ fase_sucessional_id: faseSucessional.id, hcf: 999999 })

      const response = await agent.delete(`/api/v1/fases-sucessionais/${faseSucessional.id}`).set(buildAuthHeader()).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/está em uso e não pode ser removida|em uso/i)
    } finally {
      await knex('tombos').where({ fase_sucessional_id: faseSucessional.id }).delete()
      await knex('fase_sucessional').where({ id: faseSucessional.id }).delete()
    }
  })

  test('rejeita token ausente', async () => {
    const response = await agent.delete('/api/v1/fases-sucessionais/1').expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized/i)
  })

  test('rejeita usuário com papel fora do permitido', async () => {
    const response = await agent.delete('/api/v1/fases-sucessionais/1').set(buildAuthHeader({ id: outsiderId })).expect(403)
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
    const response = await agent.delete('/api/v1/fases-sucessionais/1').set({ Authorization: `Bearer ${token}` }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized|expired/i)
  })

  test('rejeita token inválido', async () => {
    const token = jwt.sign({ id: writerId }, 'segredo-diferente')
    const response = await agent.delete('/api/v1/fases-sucessionais/1').set({ Authorization: `Bearer ${token}` }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/unauthorized/i)
  })
})
