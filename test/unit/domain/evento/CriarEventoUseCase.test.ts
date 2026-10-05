import {
  describe, expect, test, vi
} from 'vitest'

import { CriarEventoUseCase } from '@/domain/evento/CriarEventoUseCase'
import { Attributes, CreateAttributes } from '@/domain/evento/Evento'
import { EventoCollection } from '@/domain/evento/EventoCollection'
import { Either } from '@/library/either/Either'

const attributes: Attributes = {
  altitude: null,
  capturado_em: new Date('2026-02-15T14:32:00Z'),
  coleta: null,
  created_at: new Date(),
  created_by: null,
  expedicao_id: 1,
  id: 10,
  latitude: -20.2508,
  longitude: -46.4167,
  observacoes: 'Solo arenoso',
  tipo: 'DIARIO',
  updated_at: new Date(),
  updated_by: null
}

const validInput: CreateAttributes = {
  altitude: null,
  capturado_em: new Date('2026-02-15T14:32:00Z'),
  coleta: null,
  created_by: null,
  expedicao_id: 1,
  latitude: -20.2508,
  longitude: -46.4167,
  observacoes: 'Solo arenoso',
  tipo: 'DIARIO'
}

const makeMockCollection = (overrides?: Partial<EventoCollection>): EventoCollection => ({
  create: vi.fn().mockResolvedValue(Either.right(attributes)),
  delete: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  ...overrides
})

describe('CriarEventoUseCase', () => {
  test('cria o evento quando os dados são válidos', async () => {
    const collection = makeMockCollection()
    const useCase = new CriarEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute(validInput)

    expect(result.right()).toBe(true)
    expect(result.value).toEqual(attributes)
    expect(collection.create).toHaveBeenCalledWith(validInput)
  })

  test('não chama a collection quando a validação de domínio falha (COLETA sem ficha)', async () => {
    const collection = makeMockCollection()
    const useCase = new CriarEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute({ ...validInput, tipo: 'COLETA' })

    expect(result.left()).toBe(true)
    expect(collection.create).not.toHaveBeenCalled()
  })

  test('propaga erro de infraestrutura da collection', async () => {
    const error = new Error('DB failure')
    const collection = makeMockCollection({
      create: vi.fn().mockResolvedValue(Either.left(error))
    })
    const useCase = new CriarEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute(validInput)

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
  })
})
