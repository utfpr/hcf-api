import {
  describe, expect, test, vi
} from 'vitest'

import { ListaPaisesUseCase } from '@/domain/pais/ListaPaisesUseCase'
import { PaisCollection } from '@/domain/pais/PaisCollection'
import { Either } from '@/library/either/Either'

const makeMockCollection = (overrides?: Partial<PaisCollection>): PaisCollection => ({
  findAll: vi.fn().mockResolvedValue(Either.right([])),
  ...overrides
})

describe('ListaPaisesUseCase', () => {
  test('returns países from the collection', async () => {
    const expected = [
      {
        id: 1, nome: 'Brasil', sigla: 'BRA'
      }
    ]
    const collection = makeMockCollection({
      findAll: vi.fn().mockResolvedValue(Either.right(expected))
    })

    const useCase = new ListaPaisesUseCase({ paisCollection: collection })
    const result = await useCase.execute({})

    expect(result.right()).toBe(true)
    expect(result.value).toEqual(expected)
  })

  test('passes nome filter to the collection', async () => {
    const collection = makeMockCollection()

    const useCase = new ListaPaisesUseCase({ paisCollection: collection })
    await useCase.execute({ nome: 'Brasil' })

    expect(collection.findAll).toHaveBeenCalledWith({ nome: 'Brasil' })
  })

  test('returns empty list when no países match', async () => {
    const collection = makeMockCollection({
      findAll: vi.fn().mockResolvedValue(Either.right([]))
    })

    const useCase = new ListaPaisesUseCase({ paisCollection: collection })
    const result = await useCase.execute({ nome: 'Inexistente' })

    expect(result.right()).toBe(true)
    expect(result.value).toHaveLength(0)
  })

  test('propagates collection error as Either.left', async () => {
    const error = new Error('DB failure')
    const collection = makeMockCollection({
      findAll: vi.fn().mockResolvedValue(Either.left(error))
    })

    const useCase = new ListaPaisesUseCase({ paisCollection: collection })
    const result = await useCase.execute({})

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
  })
})
