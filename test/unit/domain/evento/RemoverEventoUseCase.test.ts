import {
  describe, expect, test, vi
} from 'vitest'

import { EventoCollection } from '@/domain/evento/EventoCollection'
import { RemoverEventoUseCase } from '@/domain/evento/RemoverEventoUseCase'
import { Either } from '@/library/either/Either'

const makeMockCollection = (overrides?: Partial<EventoCollection>): EventoCollection => ({
  create: vi.fn(),
  delete: vi.fn().mockResolvedValue(Either.right(true)),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  ...overrides
})

describe('RemoverEventoUseCase', () => {
  test('retorna true quando o evento é removido', async () => {
    const collection = makeMockCollection()
    const useCase = new RemoverEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute({ id: 10 })

    expect(result.right()).toBe(true)
    expect(result.value).toBe(true)
    expect(collection.delete).toHaveBeenCalledWith(10)
  })

  test('retorna false quando o evento não existe', async () => {
    const collection = makeMockCollection({
      delete: vi.fn().mockResolvedValue(Either.right(false))
    })
    const useCase = new RemoverEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute({ id: 999 })

    expect(result.right()).toBe(true)
    expect(result.value).toBe(false)
  })

  test('propaga erro de infraestrutura', async () => {
    const error = new Error('DB failure')
    const collection = makeMockCollection({
      delete: vi.fn().mockResolvedValue(Either.left(error))
    })
    const useCase = new RemoverEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute({ id: 10 })

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
  })
})
