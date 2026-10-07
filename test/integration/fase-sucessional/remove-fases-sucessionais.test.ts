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

describe('DELETE /api/v2/fases-sucessionais/:faseSucessionalId', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('remove uma fase sucessional com sucesso', async () => {
    const nome = `XFAS_REMOVE_${Date.now()}`
    const [faseSucessional] = await knex('fase_sucessional')
      .insert({ nome })
      .returning<{ id: number; nome: string }[]>(['id', 'nome'])

    const response = await agent.delete(`/api/v2/fases-sucessionais/${faseSucessional.id}`).set(buildAuthHeader()).expect(204)
    expect(response.text).toBe('')
  })

  test('retorna 400 para id inválido', async () => {
    const response = await agent.delete('/api/v2/fases-sucessionais/abc').set(buildAuthHeader()).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 404 para id inexistente', async () => {
    const response = await agent.delete('/api/v2/fases-sucessionais/999999').set(buildAuthHeader()).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrada|not found/i)
  })

  test('retorna 409 quando a fase ainda está em uso em tombos ou locais de coleta', async () => {
    const nome = `XFAS_EM_USO_${Date.now()}`
    const [faseSucessional] = await knex('fase_sucessional').insert({ nome }).returning<{ id: number; nome: string }[]>(['id', 'nome'])

    try {
      await knex('tombos').insert({ fase_sucessional_id: faseSucessional.id, hcf: 999999 })

      const response = await agent.delete(`/api/v2/fases-sucessionais/${faseSucessional.id}`).set(buildAuthHeader()).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/está em uso e não pode ser removida|em uso/i)
    } finally {
      await knex('tombos').where({ fase_sucessional_id: faseSucessional.id }).delete()
      await knex('fase_sucessional').where({ id: faseSucessional.id }).delete()
    }
  })

  test('rejeita token ausente', async () => {
    const response = await agent.delete('/api/v2/fases-sucessionais/1').expect(403)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/Token de autenticação obrigatório|sem permissão/i)
  })

  test('rejeita usuário com papel fora do permitido', async () => {
    const response = await agent.delete('/api/v2/fases-sucessionais/1').set(buildAuthHeader({ id: 1, tipo_usuario_id: 99 })).expect(403)
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
    const response = await agent.delete('/api/v2/fases-sucessionais/1').set({ Authorization: `Bearer ${token}` }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/token expirado|expirado/i)
  })

  test('rejeita token inválido', async () => {
    const token = jwt.sign({ id: 1, tipo_usuario_id: 1 }, 'segredo-diferente')
    const response = await agent.delete('/api/v2/fases-sucessionais/1').set({ Authorization: `Bearer ${token}` }).expect(401)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/token de autenticação inválido|inválido/i)
  })
})
