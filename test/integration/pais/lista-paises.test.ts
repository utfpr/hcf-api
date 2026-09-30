import jwt from 'jsonwebtoken'
import {
  afterAll, describe, expect, test
} from 'vitest'

import { geraTokenUsuario } from '@/helpers/tokens'

import { createTestApp } from '../setup/app-factory'

type Pais = { id: number; nome: string; sigla: string }

const returning = [
  'id',
  'nome',
  'sigla'
] as const

describe('GET /api/v1/paises', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('retorna 200 com os países que correspondem ao filtro de nome, ordenados por nome', async () => {
    const inserted = await knex('paises')
      .insert([
        { nome: 'XPAI Argentina', sigla: 'XPAR' },
        { nome: 'XPAI Brasil', sigla: 'XPBR' }
      ])
      .returning<Pais[]>(returning)

    try {
      const response = await agent.get('/api/v1/paises?nome=XPAI').expect(200)
      expect(response.body).toEqual(inserted)
    } finally {
      await knex('paises').whereIn('sigla', ['XPAR', 'XPBR']).delete()
    }
  })

  test('filtra pelo parâmetro nome sem distinção entre maiúsculas e minúsculas', async () => {
    const [pais] = await knex('paises')
      .insert({ nome: 'XPCI Brasil', sigla: 'XPCB' })
      .returning<Pais[]>(returning)

    try {
      const response = await agent.get('/api/v1/paises?nome=xpci bra').expect(200)
      expect(response.body).toEqual([pais])
    } finally {
      await knex('paises').where({ sigla: 'XPCB' }).delete()
    }
  })

  test('retorna array vazio quando nenhum país corresponde ao filtro', async () => {
    const response = await agent.get('/api/v1/paises?nome=XNOMATCH').expect(200)
    expect(response.body).toEqual([])
  })

  test('recusa um JWT de 2 dias no /v1', async () => {
    const token = String(geraTokenUsuario({
      id: 1,
      nome: 'Legacy',
      email: 'legacy@example.test',
      tipo_usuario_id: 1
    }))
    const response = await agent
      .get('/api/v1/paises')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
    expect(response.body).toMatchObject({ error: { type: 'unauthorized' } })
  })

  test('access JWT expirado retorna access_expired', async () => {
    const token = jwt.sign(
      {
        sub: '1',
        sid: '11111111-1111-4111-8111-111111111111',
        typ: 'access'
      },
      process.env.JWT_SECRET ?? '',
      { algorithm: 'HS256', expiresIn: 0 }
    )
    const response = await agent
      .get('/api/v1/paises')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
    expect(response.body).toMatchObject({ error: { type: 'access_expired' } })
  })
})
