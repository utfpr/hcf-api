import jwt from 'jsonwebtoken'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth, createUsuarioAuth } from '../setup/curador-auth'
import { insertLocalColeta, insertLocalColetaCidade } from '../setup/local-coleta-fixtures'

type ApiErrorResponse = { error: { message: string } }

describe('DELETE /api/v1/locais-coleta/:localColetaId', () => {
  const { agent, knex } = createTestApp()
  let curadorHeader: { Authorization: string }
  let leitorHeader: { Authorization: string }
  let cleanupCurador: () => Promise<void>
  let cleanupLeitor: () => Promise<void>

  beforeAll(async () => {
    const curador = await createCuradorAuth(knex)
    const leitor = await createUsuarioAuth(knex, 3, 'Identificador')
    curadorHeader = curador.header
    leitorHeader = leitor.header
    cleanupCurador = curador.cleanup
    cleanupLeitor = leitor.cleanup
  })

  afterAll(async () => {
    await cleanupLeitor?.()
    await cleanupCurador?.()
    await knex.destroy()
  })

  test('remove local de coleta sem uso', async () => {
    const cidade = await insertLocalColetaCidade(knex)
    const localColetaId = await insertLocalColeta(knex, cidade.id, 'Local livre')

    try {
      const response = await agent.delete(`/api/v1/locais-coleta/${localColetaId}`)
        .set(curadorHeader)
        .expect(204)
      expect(response.text).toBe('')
    } finally {
      await knex('locais_coleta').where({ id: localColetaId }).delete()
      await cidade.cleanup()
    }
  })

  test('retorna 400 para ID inválido, 404 para local inexistente e 409 para local em uso', async () => {
    const cidade = await insertLocalColetaCidade(knex)
    const localColetaId = await insertLocalColeta(knex, cidade.id, 'Local referenciado')
    const hcf = Date.now()
    await knex('tombos').insert({ hcf, local_coleta_id: localColetaId })

    try {
      await agent.delete('/api/v1/locais-coleta/abc').set(curadorHeader).expect(400)
      await agent.delete('/api/v1/locais-coleta/999999999').set(curadorHeader).expect(404)
      const response = await agent.delete(`/api/v1/locais-coleta/${localColetaId}`)
        .set(curadorHeader)
        .expect(409)
      expect((response.body as ApiErrorResponse).error.message).toMatch(/em uso|tombos/i)
    } finally {
      await knex('tombos').where({ hcf }).delete()
      await knex('locais_coleta').where({ id: localColetaId }).delete()
      await cidade.cleanup()
    }
  })

  test('retorna 401 sem token', async () => {
    await agent.delete('/api/v1/locais-coleta/1').expect(401)
  })

  test('retorna 401 para token vazio, inválido ou expirado', async () => {
    const expiredToken = jwt.sign(
      {
        id: 1,
        tipo_usuario_id: 1,
        exp: Math.floor(Date.now() / 1000) - 60
      },
      process.env.JWT_SECRET as string
    )
    const invalidToken = jwt.sign({ id: 1, tipo_usuario_id: 1 }, 'segredo-diferente')
    const headers = [
      { Authorization: 'Bearer ' },
      { Authorization: `Bearer ${invalidToken}` },
      { Authorization: `Bearer ${expiredToken}` }
    ]

    for (const header of headers) {
      await agent.delete('/api/v1/locais-coleta/1').set(header).expect(401)
    }
  })

  test('retorna 403 para usuário sem permissão de escrita', async () => {
    const cidade = await insertLocalColetaCidade(knex)
    const localColetaId = await insertLocalColeta(knex, cidade.id, 'Local protegido')

    try {
      await agent.delete(`/api/v1/locais-coleta/${localColetaId}`)
        .set(leitorHeader)
        .expect(403)
    } finally {
      await knex('locais_coleta').where({ id: localColetaId }).delete()
      await cidade.cleanup()
    }
  })
})
