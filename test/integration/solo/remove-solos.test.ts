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

describe('DELETE /api/v2/solos/:soloId', () => {
  const { agent, knex } = createTestApp()

  let auth: Awaited<ReturnType<typeof createSoloAuth>>

  beforeAll(async () => {
    auth = await createSoloAuth(knex)
  })

  afterAll(async () => {
    await auth?.cleanup()
    await knex.destroy()
  })

  test('remove um solo sem dependências', async () => {
    const prefix = `DELSOL-${Date.now()}`
    const [solo] = await knex<Solo>('solos')
      .insert({ nome: `${prefix} Removível` })
      .returning(['id', 'nome']) as Solo[]

    try {
      await agent.delete(`/api/v2/solos/${solo.id}`).set(auth.header).expect(204)
      const found = await knex('solos').where({ id: solo.id }).first()
      expect(found).toBeUndefined()
    } finally {
      await knex('solos').where('nome', 'like', `${prefix}%`).delete()
    }
  })

  test('retorna 404 quando o solo não existe', async () => {
    const response = await agent.delete('/api/v2/solos/999999').set(auth.header).expect(404)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/não encontrad|not found/i)
  })

  test('retorna 400 quando o id é inválido', async () => {
    const response = await agent.delete('/api/v2/solos/abc').set(auth.header).expect(400)
    const body = response.body as { error: { message: string } }

    expect(body.error.message).toMatch(/inválido|invalid/i)
  })

  test('retorna 409 quando o solo está em uso em um tombo', async () => {
    const prefix = `USESOL-${Date.now()}`
    const [solo] = await knex<Solo>('solos')
      .insert({ nome: `${prefix} Em Uso` })
      .returning(['id', 'nome']) as Solo[]

    try {
      await knex('tombos').insert({
        hcf: 9000000000 + Date.now(),
        solo_id: solo.id,
        ativo: true,
        rascunho: false,
        created_at: new Date(),
        updated_at: new Date()
      })

      const response = await agent.delete(`/api/v2/solos/${solo.id}`).set(auth.header).expect(409)
      const body = response.body as { error: { message: string } }

      expect(body.error.message).toMatch(/em uso|in use|uso/i)
    } finally {
      await knex('tombos').where({ solo_id: solo.id }).delete()
      await knex('solos').where({ id: solo.id }).delete()
    }
  })
})
