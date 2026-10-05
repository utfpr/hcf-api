import {
  describe, expect, test, vi
} from 'vitest'

import { CriaLembreteUseCase } from '@/domain/lembrete/CriaLembreteUseCase'
import { Attributes, CreateAttributes } from '@/domain/lembrete/Lembrete'
import { LembreteCollection } from '@/domain/lembrete/LembreteCollection'
import { Either } from '@/library/either/Either'

const fichaVazia = {
  familia: null,
  nome_popular: null,
  nome_cientifico: null,
  municipio: null,
  estado: null,
  referencia_local: null,
  tipo_vegetacao: null,
  solo: null,
  relevo: null,
  substrato: null,
  tronco_com_casca: null,
  associacoes: null,
  folhas: null,
  habito: null,
  frutos: null,
  flores: null,
  luminosidade: null
}

const validInput: CreateAttributes = {
  ...fichaVazia,
  created_by: null,
  data_coleta: '2026-11-20',
  local_coleta: 'Serra do Cipó',
  nome_cientifico: 'Vellozia squamata'
}

const attributes: Attributes = {
  ...validInput,
  created_at: new Date(),
  id: 10,
  updated_at: new Date(),
  updated_by: null
}

const makeMockCollection = (overrides?: Partial<LembreteCollection>): LembreteCollection => ({
  create: vi.fn().mockResolvedValue(Either.right(attributes)),
  delete: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  ...overrides
})

describe('CriaLembreteUseCase', () => {
  test('cria o lembrete quando os dados são válidos', async () => {
    const collection = makeMockCollection()
    const useCase = new CriaLembreteUseCase({ lembreteCollection: collection })

    const result = await useCase.execute(validInput)

    expect(result.right()).toBe(true)
    expect(result.value).toEqual(attributes)
    expect(collection.create).toHaveBeenCalledWith(validInput)
  })

  test('não chama a collection quando a data de coleta é inválida', async () => {
    const collection = makeMockCollection()
    const useCase = new CriaLembreteUseCase({ lembreteCollection: collection })

    const result = await useCase.execute({ ...validInput, data_coleta: 'amanhã' })

    expect(result.left()).toBe(true)
    expect(collection.create).not.toHaveBeenCalled()
  })

  test('propaga erro de infraestrutura da collection', async () => {
    const error = new Error('DB failure')
    const collection = makeMockCollection({
      create: vi.fn().mockResolvedValue(Either.left(error))
    })
    const useCase = new CriaLembreteUseCase({ lembreteCollection: collection })

    const result = await useCase.execute(validInput)

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
  })
})
