import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { ExpedicaoCollectionKnexAdapter } from '@/infrastructure/ExpedicaoCollectionKnexAdapter'

import { createTestKnex } from '../setup/app-factory'
import {
  cleanupExpedicaoFixtures,
  ExpedicaoFixtures,
  seedExpedicaoFixtures
} from '../setup/seeds/expedicao.seed'

describe('ExpedicaoCollectionKnexAdapter - Sub-recursos (Participantes e Rotas)', () => {
  const knex = createTestKnex()
  const collection = new ExpedicaoCollectionKnexAdapter({ knex })

  let fixtures: ExpedicaoFixtures
  let locaisIds: number[] = []

  beforeAll(async () => {
    fixtures = await seedExpedicaoFixtures(knex)

    // Seed: Criar locais de coleta falsos para as cidades das fixtures para os testes novos
    const locaisCriados = await knex('locais_coleta')
      .insert([
        { descricao: 'Local Teste 1', cidade_id: fixtures.cidades[1] },
        { descricao: 'Local Teste 2', cidade_id: fixtures.cidades[2] }
      ])
      .returning('id') as Array<{ id: string | number }>

    locaisIds = [Number(locaisCriados[0].id), Number(locaisCriados[1].id)]
  })

  afterAll(async () => {
    await knex('locais_coleta').whereIn('id', locaisIds).delete()
    await cleanupExpedicaoFixtures(knex, fixtures)
    await knex.destroy()
  })

  async function criarExpedicaoParaTeste(prefixo: string) {
    return collection.create({
      descricao: `Expedicao [${prefixo}] - Teste Isolado`,
      data_inicio: '2026-04-01',
      data_fim: '2026-04-10',
      cidade_id: fixtures.cidades[0],
      created_by: fixtures.usuarios[0],
      participantes: [fixtures.usuarios[0]],
      rotas: [{ cidade_id: fixtures.cidades[1], locais_coleta_ids: [locaisIds[0]] }]
    })
  }

  describe('Adicionar e Remover Participantes', () => {
    test('addParticipant insere um novo usuário na expedição', async () => {
      const created = await criarExpedicaoParaTeste('ADD_PART')
      expect(created.right()).toBe(true)
      if (!created.right()) return
      const expedicaoId = created.value.id

      try {
        const novoParticipante = fixtures.usuarios[1]
        const result = await collection.addParticipant(
          expedicaoId,
          novoParticipante
        )
        expect(result.right()).toBe(true)
        const banco = await knex<{ expedicao_id: number; usuario_id: number | string }>('expedicoes_participantes')
          .where({ expedicao_id: expedicaoId, usuario_id: novoParticipante })
          .first()

        expect(banco).toBeDefined()
        expect(Number(banco?.usuario_id)).toBe(novoParticipante)
      } finally {
        await knex('expedicoes').where({ id: expedicaoId }).delete()
      }
    })

    test('addParticipant falha ao tentar inserir usuário já existente (unique constraint)', async () => {
      const created = await criarExpedicaoParaTeste('ADD_FAIL_UNIQUE')
      if (!created.right()) return
      const expedicaoId = created.value.id

      try {
        const participanteExistente = fixtures.usuarios[0]

        const result = await collection.addParticipant(
          expedicaoId,
          participanteExistente
        )

        expect(result.left()).toBe(true)
        if (result.left()) {
          expect(result.value.message).toContain('já está nesta expedição')
        }
      } finally {
        await knex('expedicoes').where({ id: expedicaoId }).delete()
      }
    })

    test('removeParticipant exclui o usuário da expedição', async () => {
      const created = await criarExpedicaoParaTeste('REM_PART')
      if (!created.right()) return
      const expedicaoId = created.value.id

      try {
        const participanteParaRemover = fixtures.usuarios[0]

        const result = await collection.removeParticipant(
          expedicaoId,
          participanteParaRemover
        )
        expect(result.right()).toBe(true)

        const banco = await knex<{ expedicao_id: number; usuario_id: number | string }>('expedicoes_participantes')
          .where({
            expedicao_id: expedicaoId,
            usuario_id: participanteParaRemover
          })
          .first()

        expect(banco).toBeUndefined()
      } finally {
        await knex('expedicoes').where({ id: expedicaoId }).delete()
      }
    })
  })

  describe('Substituir Rotas', () => {
    test('substituteRoute remove as antigas e insere as novas na ordem correta com locais de coleta', async () => {
      const created = await criarExpedicaoParaTeste('SUB_ROTAS')
      if (!created.right()) return
      const expedicaoId = created.value.id

      try {
        const novasRotas = [
          { cidade_id: fixtures.cidades[2], locais_coleta_ids: [locaisIds[1]] },
          { cidade_id: fixtures.cidades[0], locais_coleta_ids: [] },
          { cidade_id: fixtures.cidades[2], locais_coleta_ids: [] }
        ]

        const result = await collection.substituteRoute(
          expedicaoId,
          novasRotas
        )
        expect(result.right()).toBe(true)

        const rotasNoBanco = await knex<{ id: number; expedicao_id: number; ordem: number; cidade_id: number | string }>('expedicoes_rotas')
          .where({ expedicao_id: expedicaoId })
          .orderBy('ordem')

        expect(rotasNoBanco.length).toBe(3)

        const arrayValidacao = rotasNoBanco.map(rota => [
          rota.ordem,
          Number(rota.cidade_id)
        ])
        expect(arrayValidacao).toEqual([
          [0, novasRotas[0].cidade_id],
          [1, novasRotas[1].cidade_id],
          [2, novasRotas[2].cidade_id]
        ])

        // Verifica se vinculou o local 2 na rota 0
        const vinculos = await knex<{ local_coleta_id: number | string }>('expedicoes_rotas_locais_coleta')
          .where('expedicao_rota_id', rotasNoBanco[0].id)

        expect(vinculos.length).toBe(1)
        expect(Number(vinculos[0].local_coleta_id)).toBe(locaisIds[1])
      } finally {
        await knex('expedicoes').where({ id: expedicaoId }).delete()
      }
    })
  })
})
