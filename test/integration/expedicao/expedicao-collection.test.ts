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
})
