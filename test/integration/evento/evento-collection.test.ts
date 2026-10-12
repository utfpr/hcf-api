import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { ColetaAttributes, CreateAttributes } from '@/domain/evento/Evento'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'

import { createTestKnex } from '../setup/app-factory'
import {
  cleanupExpedicaoFixtures, ExpedicaoFixtures, seedExpedicaoFixtures
} from '../setup/seeds/expedicao.seed'

const ficha: ColetaAttributes = {
  familia: 'Velloziaceae',
  nome_popular: 'canela-de-ema',
  nome_cientifico: 'Vellozia squamata',
  municipio: 'Serra do Cipó',
  estado: 'MG',
  referencia_local: 'Trilha da cachoeira',
  tipo_vegetacao: 'Campo rupestre',
  solo: 'Arenoso',
  relevo: 'Ondulado',
  substrato: 'Afloramento rochoso',
  tronco_com_casca: 'Sim, gretada',
  associacoes: 'Lychnophora ericoides',
  folhas: 'Lineares',
  habito: 'Herbácea',
  frutos: 'Ausentes',
  flores: 'Lilases',
  luminosidade: 'Pleno sol'
}

describe('EventoCollectionKnexAdapter', () => {
  const knex = createTestKnex()
  const collection = new EventoCollectionKnexAdapter({ knex })

  let fixtures: ExpedicaoFixtures
  let expedicaoId: number

  beforeAll(async () => {
    fixtures = await seedExpedicaoFixtures(knex)

    const [expedicao] = await knex('expedicoes')
      .insert({
        descricao: 'XEXP eventos',
        data_inicio: '2026-02-14',
        data_fim: '2026-02-18',
        cidade_id: fixtures.cidades[0]
      })
      .returning<Array<{ id: number }>>(['id'])

    expedicaoId = expedicao.id
  })

  afterAll(async () => {
    await knex('expedicoes').where({ id: expedicaoId }).delete()
    await cleanupExpedicaoFixtures(knex, fixtures)
    await knex.destroy()
  })

  function novoDiario(): CreateAttributes {
    return {
      expedicao_id: expedicaoId,
      tipo: 'DIARIO',
      capturado_em: new Date('2026-02-15T13:15:00.000Z'),
      latitude: -20.2510,
      longitude: -46.4170,
      altitude: 1200,
      observacoes: 'Área de transição entre cerrado e campo rupestre.',
      coleta: null,
      created_by: fixtures.usuarios[0]
    }
  }

  function novaColeta(): CreateAttributes {
    return {
      ...novoDiario(),
      tipo: 'COLETA',
      capturado_em: new Date('2026-02-15T14:32:00.000Z'),
      observacoes: null,
      coleta: ficha
    }
  }

  test('grava o evento e sua ficha na mesma transação', async () => {
    const created = await collection.create(novaColeta())

    expect(created.right()).toBe(true)
    if (!created.right()) return

    try {
      expect(created.value.coleta).toEqual(ficha)
      expect(created.value).toMatchObject({
        tipo: 'COLETA', latitude: -20.2510, altitude: 1200, created_by: fixtures.usuarios[0]
      })

      const fichas = await knex('eventos_coletas').where({ evento_id: created.value.id })
      expect(fichas).toHaveLength(1)
    } finally {
      await knex('eventos').where({ id: created.value.id }).delete()
    }
  })

  test('um diário não cria linha em eventos_coletas', async () => {
    const created = await collection.create(novoDiario())

    expect(created.right()).toBe(true)
    if (!created.right()) return

    try {
      expect(created.value.coleta).toBeNull()
      expect(created.value.observacoes).toBe('Área de transição entre cerrado e campo rupestre.')

      const fichas = await knex('eventos_coletas').where({ evento_id: created.value.id })
      expect(fichas).toHaveLength(0)
    } finally {
      await knex('eventos').where({ id: created.value.id }).delete()
    }
  })

  test('não grava o evento quando a ficha falha', async () => {
    const antes = await knex('eventos').where({ expedicao_id: expedicaoId }).count({ total: '*' })

    const created = await collection.create({
      ...novaColeta(),
      coleta: { ...ficha, coluna_inexistente: 'x' } as unknown as ColetaAttributes
    })

    expect(created.left()).toBe(true)

    const depois = await knex('eventos').where({ expedicao_id: expedicaoId }).count({ total: '*' })
    expect(depois).toEqual(antes)
  })

  test('o banco rejeita um tipo fora de DIARIO/COLETA', async () => {
    const created = await collection.create({ ...novoDiario(), tipo: 'FOTO' as 'DIARIO' })

    expect(created.left()).toBe(true)
  })

  test('preserva o instante de captura, distinto de created_at', async () => {
    const created = await collection.create(novaColeta())

    expect(created.right()).toBe(true)
    if (!created.right()) return

    try {
      expect(created.value.capturado_em.toISOString()).toBe('2026-02-15T14:32:00.000Z')
      expect(created.value.created_at.getTime()).toBeGreaterThan(created.value.capturado_em.getTime())
    } finally {
      await knex('eventos').where({ id: created.value.id }).delete()
    }
  })

  test('ordena o feed pelo instante de captura, do mais recente para o mais antigo', async () => {
    const cedo = await collection.create({
      ...novoDiario(), capturado_em: new Date('2026-02-15T08:00:00.000Z')
    })
    const tarde = await collection.create({
      ...novaColeta(), capturado_em: new Date('2026-02-15T18:00:00.000Z')
    })

    expect(cedo.right() && tarde.right()).toBe(true)
    if (!cedo.right() || !tarde.right()) return

    try {
      const found = await collection.findAll({ expedicao_id: expedicaoId })
      expect(found.right()).toBe(true)
      if (!found.right()) return

      expect(found.value.itens.map(evento => evento.id)).toEqual([tarde.value.id, cedo.value.id])
    } finally {
      await knex('eventos').whereIn('id', [cedo.value.id, tarde.value.id]).delete()
    }
  })

  test('filtra por tipo', async () => {
    const diario = await collection.create(novoDiario())
    const coleta = await collection.create(novaColeta())

    expect(diario.right() && coleta.right()).toBe(true)
    if (!diario.right() || !coleta.right()) return

    try {
      const found = await collection.findAll({ expedicao_id: expedicaoId, tipo: 'COLETA' })
      expect(found.right()).toBe(true)
      if (!found.right()) return

      expect(found.value.itens.map(evento => evento.id)).toEqual([coleta.value.id])
      expect(found.value.itens[0].coleta).toEqual(ficha)
    } finally {
      await knex('eventos').whereIn('id', [diario.value.id, coleta.value.id]).delete()
    }
  })

  test('filtra por intervalo de captura e pagina os resultados', async () => {
    const antes = await collection.create({
      ...novoDiario(), capturado_em: new Date('2026-02-14T10:00:00.000Z')
    })
    const dentro1 = await collection.create({
      ...novoDiario(), capturado_em: new Date('2026-02-15T10:00:00.000Z')
    })
    const dentro2 = await collection.create({
      ...novaColeta(), capturado_em: new Date('2026-02-15T14:00:00.000Z')
    })
    const depois = await collection.create({
      ...novoDiario(), capturado_em: new Date('2026-02-16T10:00:00.000Z')
    })

    expect(antes.right() && dentro1.right() && dentro2.right() && depois.right()).toBe(true)
    if (!antes.right() || !dentro1.right() || !dentro2.right() || !depois.right()) return

    try {
      const found = await collection.findAll({
        expedicao_id: expedicaoId,
        capturado_de: new Date('2026-02-15T00:00:00.000Z'),
        capturado_ate: new Date('2026-02-15T23:59:59.999Z'),
        limite: 1,
        pagina: 2
      })

      expect(found.right()).toBe(true)
      if (!found.right()) return

      expect(found.value.total).toBe(2)
      expect(found.value.limite).toBe(1)
      expect(found.value.pagina).toBe(2)
      expect(found.value.itens.map(evento => evento.id)).toEqual([dentro1.value.id])
    } finally {
      await knex('eventos')
        .whereIn('id', [
          antes.value.id,
          dentro1.value.id,
          dentro2.value.id,
          depois.value.id
        ])
        .delete()
    }
  })

  test('apaga eventos e fichas junto com a expedição', async () => {
    const [expedicao] = await knex('expedicoes')
      .insert({
        descricao: 'XEXP cascata',
        data_inicio: '2026-03-01',
        data_fim: '2026-03-02',
        cidade_id: fixtures.cidades[0]
      })
      .returning<Array<{ id: number }>>(['id'])

    const created = await collection.create({ ...novaColeta(), expedicao_id: expedicao.id })
    expect(created.right()).toBe(true)
    if (!created.right()) return

    await knex('expedicoes').where({ id: expedicao.id }).delete()

    const found = await collection.findById(created.value.id)
    expect(found.right()).toBe(true)
    if (!found.right()) return
    expect(found.value).toBeNull()

    const fichas = await knex('eventos_coletas').where({ evento_id: created.value.id })
    expect(fichas).toHaveLength(0)
  })

  test('devolve null quando o evento não existe', async () => {
    const found = await collection.findById(-1)
    expect(found.right()).toBe(true)
    if (!found.right()) return
    expect(found.value).toBeNull()
  })
})
