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
  let locaisIds: number[] = []

  beforeAll(async () => {
    fixtures = await seedExpedicaoFixtures(knex)

    // Seed: Criar locais de coleta para as cidades das fixtures para os testes novos
    const locaisCriados = await knex('locais_coleta')
      .insert([
        { descricao: 'Local Teste 1', cidade_id: fixtures.cidades[1] },
        { descricao: 'Local Teste 2', cidade_id: fixtures.cidades[1] },
        { descricao: 'Local Teste 3', cidade_id: fixtures.cidades[2] }
      ])
      .returning('id') as Array<{ id: string | number }>

    locaisIds = [
      Number(locaisCriados[0].id),
      Number(locaisCriados[1].id),
      Number(locaisCriados[2].id)
    ]
  })

  afterAll(async () => {
    await knex('expedicoes').whereIn('cidade_id', fixtures.cidades).delete()
    await knex('locais_coleta').whereIn('id', locaisIds).delete()
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
        { cidade_id: fixtures.cidades[1], locais_coleta_ids: [locaisIds[0], locaisIds[1]] },
        { cidade_id: fixtures.cidades[2], locais_coleta_ids: [locaisIds[2]] },
        { cidade_id: fixtures.cidades[1], locais_coleta_ids: [] } // Passagem sem locais
      ]
    }
  }

  test('grava a expedição, seus participantes, rotas e locais de coleta na mesma transação', async () => {
    const created = await collection.create(novaExpedicao())

    expect(created.right()).toBe(true)
    if (!created.right()) return

    try {
      expect(created.value).toMatchObject({
        descricao: 'Coleta no litoral',
        data_inicio: '2026-03-01',
        data_fim: '2026-03-10',
        cidade_id: fixtures.cidades[0],
        created_by: fixtures.usuarios[0]
      })

      const participantes = await knex('expedicoes_participantes')
        .where({ expedicao_id: created.value.id })
        .orderBy('id') as Array<{ usuario_id: string }>
      expect(participantes.map(participante => Number(participante.usuario_id))).toEqual(fixtures.usuarios)

      const rotas = await knex('expedicoes_rotas')
        .where({ expedicao_id: created.value.id })
        .orderBy('ordem') as Array<{ id: number; ordem: number; cidade_id: string }>

      expect(rotas.map(rota => [rota.ordem, Number(rota.cidade_id)])).toEqual([
        [0, fixtures.cidades[1]],
        [1, fixtures.cidades[2]],
        [2, fixtures.cidades[1]]
      ])

      // Verifica inserção na nova tabela intermediária
      const locaisDaRota0 = await knex<{ local_coleta_id: number | string }>('expedicoes_rotas_locais_coleta')
        .where('expedicao_rota_id', rotas[0].id).orderBy('local_coleta_id')

      expect(locaisDaRota0.length).toBe(2)
      expect(Number(locaisDaRota0[0].local_coleta_id)).toBe(locaisIds[0])
      expect(Number(locaisDaRota0[1].local_coleta_id)).toBe(locaisIds[1])

      const locaisDaRota2 = await knex<{ local_coleta_id: number | string }>('expedicoes_rotas_locais_coleta')
        .where('expedicao_rota_id', rotas[2].id)
      expect(locaisDaRota2.length).toBe(0)
    } finally {
      await knex('expedicoes').where({ id: created.value.id }).delete()
    }
  })

  test('rejeita criação quando local_coleta_id for de cidade diferente da rota (Teste Integração)', async () => {
    const payload = novaExpedicao()
    // Tentando vincular o local 3 (que é da cidade 2) à rota da cidade 1
    payload.rotas[0].locais_coleta_ids.push(locaisIds[2])

    const created = await collection.create(payload)
    expect(created.left()).toBe(true)
    if (!created.left()) return
    expect(created.value.message).toContain('pertence a outra cidade')
  })

  test('rejeita criação quando local_coleta_id não existir (Teste Integração)', async () => {
    const payload = novaExpedicao()
    payload.rotas[0].locais_coleta_ids.push(999999) // ID Inexistente

    const created = await collection.create(payload)
    expect(created.left()).toBe(true)
    if (!created.left()) return
    expect(created.value.message).toContain('não existe')
  })

  test('substitui as rotas e locais de coleta (PUT /v2/expedicoes/:id/rotas)', async () => {
    const created = await collection.create(novaExpedicao())
    if (!created.right()) return

    try {
      // Nova rota
      const novasRotas = [{ cidade_id: fixtures.cidades[2], locais_coleta_ids: [locaisIds[2]] }]

      const subResult = await collection.substituteRoute(created.value.id, novasRotas)
      expect(subResult.right()).toBe(true)

      // Verifica no BD se limpou as antigas e pôs a nova
      const rotasFinais = await knex<{ cidade_id: number | string }>('expedicoes_rotas')
        .where('expedicao_id', created.value.id)

      expect(rotasFinais.length).toBe(1)
      expect(Number(rotasFinais[0].cidade_id)).toBe(fixtures.cidades[2])
    } finally {
      await knex('expedicoes').where({ id: created.value.id }).delete()
    }
  })

  test('Verificação de ON DELETE CASCADE ao remover a rota/expedição', async () => {
    const created = await collection.create(novaExpedicao())
    if (!created.right()) return

    // Busca IDs das rotas para conferir depois
    const rotas = await knex<{ id: number }>('expedicoes_rotas').where('expedicao_id', created.value.id)
    const rotasIds = rotas.map(r => r.id)

    // Verifica que existem vínculos
    const vinculosAntes = await knex('expedicoes_rotas_locais_coleta').whereIn('expedicao_rota_id', rotasIds)
    expect(vinculosAntes.length).toBeGreaterThan(0)

    // Deleta a expedição
    await collection.delete(created.value.id)

    // Verifica CASCADE
    const vinculosDepois = await knex('expedicoes_rotas_locais_coleta').whereIn('expedicao_rota_id', rotasIds)
    expect(vinculosDepois.length).toBe(0)
  })

  test('Verificação de ON DELETE RESTRICT ao tentar apagar um locais_coleta vinculado a uma rota ativa', async () => {
    const created = await collection.create(novaExpedicao())
    if (!created.right()) return

    try {
      // Tenta deletar o local 1 que está atrelado à rota 0 desta expedição
      await expect(knex('locais_coleta').where('id', locaisIds[0]).delete()).rejects.toThrowError()
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

    test('filtra por data_fim_de (data_fim maior ou igual a uma data)', async () => {
      // Busca expedições com data_fim a partir de 2026-06-01 (exp2 e exp3)
      const found = await collection.findAll({
        data_fim_de: '2026-06-01'
      })
      expect(found.right()).toBe(true)
      if (!found.right()) return

      const returnedIds = found.value.itens.map(e => e.id)
      expect(returnedIds).toContain(ids[1])
      expect(returnedIds).toContain(ids[2])
      expect(returnedIds).not.toContain(ids[0])
    })

    test('filtra por data_inicio_ate (data_inicio menor ou igual a uma data)', async () => {
      // Busca expedições com data_inicio até 2026-06-01 (exp1 e exp2)
      const found = await collection.findAll({
        data_inicio_ate: '2026-06-01'
      })
      expect(found.right()).toBe(true)
      if (!found.right()) return

      const returnedIds = found.value.itens.map(e => e.id)
      expect(returnedIds).toContain(ids[0])
      expect(returnedIds).toContain(ids[1])
      expect(returnedIds).not.toContain(ids[2])
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
