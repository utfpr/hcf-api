import {
  afterAll, describe, expect, test
} from 'vitest'

import { CreateAttributes } from '@/domain/lembrete/Lembrete'
import { LembreteCollectionKnexAdapter } from '@/infrastructure/LembreteCollectionKnexAdapter'

import { createTestKnex } from '../setup/app-factory'

const PREFIXO = 'XLEMB'

function novoLembrete(overrides: Partial<CreateAttributes> = {}): CreateAttributes {
  return {
    data_coleta: '2026-11-20',
    local_coleta: `${PREFIXO} Serra do Cipó`,
    familia: 'Velloziaceae',
    nome_popular: 'canela-de-ema',
    nome_cientifico: 'Vellozia squamata',
    municipio: 'Santana do Riacho',
    estado: 'MG',
    referencia_local: 'Trilha da cachoeira',
    tipo_vegetacao: 'Campo rupestre',
    solo: 'Arenoso',
    relevo: 'Ondulado',
    substrato: 'Afloramento rochoso',
    tronco_com_casca: null,
    associacoes: null,
    folhas: 'Lineares',
    habito: 'Herbácea',
    frutos: null,
    flores: 'Esperadas em novembro',
    luminosidade: 'Pleno sol',
    created_by: null,
    ...overrides
  }
}

describe('LembreteCollectionKnexAdapter', () => {
  const knex = createTestKnex()
  const collection = new LembreteCollectionKnexAdapter({ knex })

  afterAll(async () => {
    await knex.destroy()
  })

  async function limpar() {
    await knex('lembretes').where('local_coleta', 'like', `${PREFIXO}%`).delete()
  }

  test('cria, busca, atualiza e remove um lembrete', async () => {
    try {
      const criado = await collection.create(novoLembrete())
      expect(criado.right()).toBe(true)
      if (criado.left()) return

      expect(criado.value.data_coleta).toBe('2026-11-20')
      expect(criado.value.familia).toBe('Velloziaceae')

      const encontrado = await collection.findById(criado.value.id)
      expect(encontrado.value).toEqual(criado.value)

      const {
        id, created_at: _c, updated_at: _u, created_by: _cb, ...resto
      } = criado.value
      const atualizado = await collection.update(id, {
        ...resto,
        data_coleta: '2026-12-01',
        flores: 'Lilases'
      })
      expect(atualizado.right()).toBe(true)
      expect(atualizado.value).toMatchObject({ data_coleta: '2026-12-01', flores: 'Lilases' })

      const removido = await collection.delete(id)
      expect(removido.value).toBe(true)

      const depois = await collection.findById(id)
      expect(depois.value).toBeNull()
    } finally {
      await limpar()
    }
  })

  test('update e delete de id inexistente não quebram', async () => {
    const { created_by: _cb, ...attrs } = novoLembrete()

    const atualizado = await collection.update(999999, { ...attrs, updated_by: null })
    expect(atualizado.right()).toBe(true)
    expect(atualizado.value).toBeNull()

    const removido = await collection.delete(999999)
    expect(removido.value).toBe(false)
  })

  test('lista filtrando por intervalo de data_coleta, o mais próximo primeiro', async () => {
    try {
      await collection.create(novoLembrete({ data_coleta: '2030-03-10' }))
      await collection.create(novoLembrete({ data_coleta: '2030-01-05' }))
      await collection.create(novoLembrete({ data_coleta: '2030-08-01' }))

      const result = await collection.findAll({ data_coleta_de: '2030-01-01', data_coleta_ate: '2030-06-30' })

      expect(result.right()).toBe(true)
      if (result.left()) return
      const doTeste = result.value.itens.filter(item => item.local_coleta.startsWith(PREFIXO))
      expect(doTeste.map(item => item.data_coleta)).toEqual(['2030-01-05', '2030-03-10'])
    } finally {
      await limpar()
    }
  })
})
