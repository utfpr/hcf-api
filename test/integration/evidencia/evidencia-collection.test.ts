import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { EvidenciaCollectionKnexAdapter } from '@/infrastructure/EvidenciaCollectionKnexAdapter'

import { createTestKnex } from '../setup/app-factory'
import {
  cleanupExpedicaoFixtures, ExpedicaoFixtures, seedExpedicaoFixtures
} from '../setup/seeds/expedicao.seed'

describe('EvidenciaCollectionKnexAdapter', () => {
  const knex = createTestKnex()
  const collection = new EvidenciaCollectionKnexAdapter({ knex })

  let fixtures: ExpedicaoFixtures
  let expedicaoId: number
  let eventoId: number

  beforeAll(async () => {
    fixtures = await seedExpedicaoFixtures(knex)

    const [expedicao] = await knex('expedicoes')
      .insert({
        descricao: 'XEXP evidências',
        data_inicio: '2026-02-14',
        data_fim: '2026-02-18',
        cidade_id: fixtures.cidades[0]
      })
      .returning<Array<{ id: number }>>(['id'])
    expedicaoId = expedicao.id

    const [evento] = await knex('eventos')
      .insert({
        expedicao_id: expedicaoId, tipo: 'DIARIO', capturado_em: new Date('2026-02-15T13:15:00.000Z')
      })
      .returning<Array<{ id: number }>>(['id'])
    eventoId = evento.id
  })

  afterAll(async () => {
    await knex('expedicoes').where({ id: expedicaoId }).delete()
    await cleanupExpedicaoFixtures(knex, fixtures)
    await knex.destroy()
  })

  test('preserva o instante de captura, distinto de created_at', async () => {
    const capturadoEm = new Date('2026-02-15T14:30:00.000Z')

    const created = await collection.create({
      evento_id: eventoId,
      nome: 'IMG_0042.jpg',
      capturado_em: capturadoEm,
      created_by: fixtures.usuarios[0]
    })

    expect(created.right()).toBe(true)
    if (!created.right()) return

    try {
      expect(created.value.capturado_em.toISOString()).toBe(capturadoEm.toISOString())
      expect(created.value.created_at.getTime()).toBeGreaterThan(capturadoEm.getTime())
      expect(created.value.updated_by).toBe(fixtures.usuarios[0])
    } finally {
      await knex('evidencias').where({ id: created.value.id }).delete()
    }
  })

  test('lista as evidências de um evento ordenadas por instante de captura', async () => {
    const tarde = await collection.create({
      evento_id: eventoId, nome: 'b.jpg', capturado_em: new Date('2026-02-15T18:00:00.000Z'), created_by: null
    })
    const cedo = await collection.create({
      evento_id: eventoId, nome: 'a.jpg', capturado_em: new Date('2026-02-15T08:00:00.000Z'), created_by: null
    })

    expect(tarde.right() && cedo.right()).toBe(true)
    if (!tarde.right() || !cedo.right()) return

    try {
      const found = await collection.findAll({
        evento_id: eventoId,
        order: { column: 'capturado_em', direction: 'asc' }
      })

      expect(found.right()).toBe(true)
      if (!found.right()) return

      expect(found.value.map(evidencia => evidencia.nome)).toEqual(['a.jpg', 'b.jpg'])
    } finally {
      await knex('evidencias').whereIn('id', [tarde.value.id, cedo.value.id]).delete()
    }
  })

  test('rejeita evidência de um evento inexistente', async () => {
    const created = await collection.create({
      evento_id: -1, nome: 'c.jpg', capturado_em: new Date(), created_by: null
    })

    expect(created.left()).toBe(true)
  })

  test('apaga as evidências junto com o evento', async () => {
    const [evento] = await knex('eventos')
      .insert({
        expedicao_id: expedicaoId, tipo: 'COLETA', capturado_em: new Date('2026-02-16T10:00:00.000Z')
      })
      .returning<Array<{ id: number }>>(['id'])

    const created = await collection.create({
      evento_id: evento.id, nome: 'd.jpg', capturado_em: new Date(), created_by: null
    })
    expect(created.right()).toBe(true)
    if (!created.right()) return

    await knex('eventos').where({ id: evento.id }).delete()

    const found = await collection.findById(created.value.id)
    expect(found.right()).toBe(true)
    if (!found.right()) return
    expect(found.value).toBeNull()
  })
})
