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

type LocalColetaResponse = {
  id: number | string
  descricao: string
  cidade_id: number | string
  fase_sucessional_id: number | string | null
}
type ApiErrorResponse = { error: { message: string } }

describe('POST /api/v1/locais-coleta', () => {
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

  test('cadastra e normaliza a descrição', async () => {
    const cidade = await insertLocalColetaCidade(knex)
    let localColetaId: string | undefined

    try {
      const response = await agent.post('/api/v1/locais-coleta')
        .set(curadorHeader)
        .send({ descricao: '  Trilha   da   mata  ', cidade_id: cidade.id })
        .expect(201)
      const body = response.body as LocalColetaResponse
      localColetaId = String(body.id)

      expect(body).toMatchObject({
        descricao: 'Trilha da mata',
        fase_sucessional_id: null
      })
      expect(Number(body.cidade_id)).toBe(cidade.id)
      expect(Number(body.id)).toBeGreaterThan(0)
    } finally {
      if (localColetaId) await knex('locais_coleta').where({ id: localColetaId }).delete()
      await cidade.cleanup()
    }
  })

  test('retorna 400 para descrição vazia, cidade ausente ou IDs inválidos', async () => {
    const cidade = await insertLocalColetaCidade(knex)

    try {
      await agent.post('/api/v1/locais-coleta')
        .set(curadorHeader)
        .send({ descricao: '   ', cidade_id: cidade.id })
        .expect(400)
      await agent.post('/api/v1/locais-coleta')
        .set(curadorHeader)
        .send({ descricao: 'Sem cidade' })
        .expect(400)
      await agent.post('/api/v1/locais-coleta')
        .set(curadorHeader)
        .send({ descricao: 'Cidade inválida', cidade_id: 'abc' })
        .expect(400)
      await agent.post('/api/v1/locais-coleta')
        .set(curadorHeader)
        .send({
          descricao: 'Fase inválida',
          cidade_id: cidade.id,
          fase_sucessional_id: 'abc'
        })
        .expect(400)
    } finally {
      await cidade.cleanup()
    }
  })

  test('retorna 409 para descrição já cadastrada na mesma cidade', async () => {
    const cidade = await insertLocalColetaCidade(knex)
    const localColetaId = await insertLocalColeta(knex, cidade.id, 'Trilha do rio')

    try {
      const response = await agent.post('/api/v1/locais-coleta')
        .set(curadorHeader)
        .send({ descricao: 'TRILHA DO RIO', cidade_id: cidade.id })
        .expect(409)
      expect((response.body as ApiErrorResponse).error.message).toMatch(/já existe|already exists/i)
    } finally {
      await knex('locais_coleta').where({ id: localColetaId }).delete()
      await cidade.cleanup()
    }
  })

  test('retorna 401 sem token', async () => {
    await agent.post('/api/v1/locais-coleta')
      .send({ descricao: 'Sem token', cidade_id: 1 })
      .expect(401)
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
      await agent.post('/api/v1/locais-coleta')
        .set(header)
        .send({ descricao: 'Token não autorizado', cidade_id: 1 })
        .expect(401)
    }
  })

  test('retorna 403 para usuário sem permissão de escrita', async () => {
    await agent.post('/api/v1/locais-coleta')
      .set(leitorHeader)
      .send({ descricao: 'Não permitido', cidade_id: 1 })
      .expect(403)
  })
})
