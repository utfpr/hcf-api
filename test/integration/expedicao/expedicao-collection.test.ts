import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { ExpedicaoCollectionKnexAdapter } from '@/infrastructure/ExpedicaoCollectionKnexAdapter'

import { createTestKnex } from '../setup/app-factory'
import {
  cleanupExpedicaoFixtures, ExpedicaoFixtures, seedExpedicaoFixtures
} from '../setup/seeds/expedicao.seed'

describe('ExpedicaoCollectionKnexAdapter', () => {
  const knex = createTestKnex()
  const collection = new ExpedicaoCollectionKnexAdapter({ knex })

  let fixtures: ExpedicaoFixtures

  beforeAll(async () => {
    fixtures = await seedExpedicaoFixtures(knex)
  })

  afterAll(async () => {
    await knex('expedicoes').whereIn('cidade_id', fixtures.cidades).delete()
    await cleanupExpedicaoFixtures(knex, fixtures)
    await knex.destroy()
  })

  function novaExpedicao() {
    return {
      descricao: 'Coleta no litoral',
      data_inicio: '2026-03-01',
      data_fim: '2026-03-10',
      cidade_id: fixtures.cidades[0],
      created_by: fixtures.usuarios[0],
      participantes: fixtures.usuarios,
      rotas: [
        fixtures.cidades[1],
        fixtures.cidades[2],
        fixtures.cidades[1]
      ]
    }
  }

  test('grava a expedição, seus participantes e suas rotas na mesma transação', async () => {
    const created = await collection.create(novaExpedicao())

    expect(created.right()).toBe(true)
    if (!created.right()) return

    try {
      expect(created.value).toMatchObject({
        descricao: 'Coleta no litoral',
        data_inicio: '2026-03-01',
        data_fim: '2026-03-10',
        cidade_id: fixtures.cidades[0],
        created_by: fixtures.usuarios[0],
        updated_by: fixtures.usuarios[0]
      })

      const participantes = await knex('expedicoes_participantes')
        .where({ expedicao_id: created.value.id })
        .orderBy('id') as Array<{ usuario_id: string }>
      expect(participantes.map(participante => Number(participante.usuario_id))).toEqual(fixtures.usuarios)

      const rotas = await knex('expedicoes_rotas')
        .where({ expedicao_id: created.value.id })
        .orderBy('ordem') as Array<{ ordem: number; cidade_id: string }>
      expect(rotas.map(rota => [rota.ordem, Number(rota.cidade_id)])).toEqual([
        [0, fixtures.cidades[1]],
        [1, fixtures.cidades[2]],
        [2, fixtures.cidades[1]]
      ])
    } finally {
      await knex('expedicoes').where({ id: created.value.id }).delete()
    }
  })

  test('não grava nada quando um participante não existe', async () => {
    const antes = await knex('expedicoes').whereIn('cidade_id', fixtures.cidades).count({ total: '*' })

    const created = await collection.create({
      ...novaExpedicao(),
      participantes: [fixtures.usuarios[0], -1]
    })

    expect(created.left()).toBe(true)

    const depois = await knex('expedicoes').whereIn('cidade_id', fixtures.cidades).count({ total: '*' })
    expect(depois).toEqual(antes)
  })

  test('devolve a data civil sem deslocamento de fuso', async () => {
    const created = await collection.create({
      ...novaExpedicao(),
      data_inicio: '2026-01-01',
      data_fim: '2026-01-01'
    })

    expect(created.right()).toBe(true)
    if (!created.right()) return

    try {
      const found = await collection.findById(created.value.id)
      expect(found.right()).toBe(true)
      if (!found.right()) return

      expect(found.value).toMatchObject({ data_inicio: '2026-01-01', data_fim: '2026-01-01' })
    } finally {
      await knex('expedicoes').where({ id: created.value.id }).delete()
    }
  })

  test('filtra por participante', async () => {
    const comAna = await collection.create({ ...novaExpedicao(), participantes: [fixtures.usuarios[0]] })
    const comBruno = await collection.create({ ...novaExpedicao(), participantes: [fixtures.usuarios[1]] })

    expect(comAna.right() && comBruno.right()).toBe(true)
    if (!comAna.right() || !comBruno.right()) return

    try {
      const found = await collection.findAll({ usuario_id: fixtures.usuarios[1] })
      expect(found.right()).toBe(true)
      if (!found.right()) return

      expect(found.value.itens.map(expedicao => expedicao.id)).toEqual([comBruno.value.id])
    } finally {
      await knex('expedicoes').whereIn('id', [comAna.value.id, comBruno.value.id]).delete()
    }
  })

  test('devolve null quando a expedição não existe', async () => {
    const found = await collection.findById(-1)
    expect(found.right()).toBe(true)
    if (!found.right()) return
    expect(found.value).toBeNull()
  })
  describe('filtros e paginação no findAll', () => {
    let ids: number[] = []

    beforeAll(async () => {
      // Cria 3 expedições distintas para testar ordenação, paginação e filtros
      const exp1 = await collection.create({
        ...novaExpedicao(),
        cidade_id: fixtures.cidades[0],
        data_inicio: '2026-05-01',
        data_fim: '2026-05-10'
      })
      const exp2 = await collection.create({
        ...novaExpedicao(),
        cidade_id: fixtures.cidades[1],
        data_inicio: '2026-06-01',
        data_fim: '2026-06-10'
      })
      const exp3 = await collection.create({
        ...novaExpedicao(),
        cidade_id: fixtures.cidades[0], // Mesma cidade da exp1
        data_inicio: '2026-07-01',
        data_fim: '2026-07-10'
      })

      if (exp1.right() && exp2.right() && exp3.right()) {
        ids = [
          exp1.value.id,
          exp2.value.id,
          exp3.value.id
        ]
      }
    })

    afterAll(async () => {
      await knex('expedicoes').whereIn('id', ids).delete()
    })

    test('devolve metadados de paginação padrão e limite de itens', async () => {
      const found = await collection.findAll({ limite: 2, pagina: 1 })
      expect(found.right()).toBe(true)
      if (!found.right()) return

      // Deve ter limite 2, estar na página 1 e totalizar no mínimo 3
      expect(found.value.limite).toBe(2)
      expect(found.value.pagina).toBe(1)
      expect(found.value.total).toBeGreaterThanOrEqual(3)
      expect(found.value.itens.length).toBeLessThanOrEqual(2)
    })

    test('filtra por cidade_id', async () => {
      const found = await collection.findAll({ cidade_id: fixtures.cidades[1] })
      expect(found.right()).toBe(true)
      if (!found.right()) return

      // Deve achar apenas a exp2
      expect(found.value.itens.map(e => e.id)).toContain(ids[1])
      expect(found.value.itens.map(e => e.id)).not.toContain(ids[0])
      expect(found.value.itens.map(e => e.id)).not.toContain(ids[2])
    })

    test('filtra por intervalo de datas (data_inicio_de e data_fim_ate)', async () => {
      // Busca expedições que comecem a partir de junho e terminem até meio de julho
      const found = await collection.findAll({
        data_inicio_de: '2026-06-01',
        data_fim_ate: '2026-07-15'
      })
      expect(found.right()).toBe(true)
      if (!found.right()) return

      // Deve achar exp2 (junho) e exp3 (julho), mas ignorar exp1 (maio)
      const returnedIds = found.value.itens.map(e => e.id)
      expect(returnedIds).toContain(ids[1])
      expect(returnedIds).toContain(ids[2])
      expect(returnedIds).not.toContain(ids[0])
    })

    test('aplica ordenação (order) corretamente', async () => {
      const foundDesc = await collection.findAll({ order: { column: 'data_inicio', direction: 'desc' } })
      expect(foundDesc.right()).toBe(true)
      if (!foundDesc.right()) return

      const foundAsc = await collection.findAll({ order: { column: 'data_inicio', direction: 'asc' } })
      expect(foundAsc.right()).toBe(true)
      if (!foundAsc.right()) return

      const idxDesc3 = foundDesc.value.itens.findIndex(e => e.id === ids[2]) // Julho
      const idxDesc1 = foundDesc.value.itens.findIndex(e => e.id === ids[0]) // Maio

      const idxAsc3 = foundAsc.value.itens.findIndex(e => e.id === ids[2]) // Julho
      const idxAsc1 = foundAsc.value.itens.findIndex(e => e.id === ids[0]) // Maio

      // DESC: Julho (exp3) vem antes de Maio (exp1)
      expect(idxDesc3).toBeLessThan(idxDesc1)
      // ASC: Maio (exp1) vem antes de Julho (exp3)
      expect(idxAsc1).toBeLessThan(idxAsc3)
    })
  })
})
