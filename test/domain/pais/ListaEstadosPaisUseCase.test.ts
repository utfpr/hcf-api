import {
  describe, expect, test, vi
} from 'vitest'

import { ListaEstadosPaisUseCase } from '@/domain/pais/ListaEstadosPaisUseCase'
import { PaisCollection } from '@/domain/pais/PaisCollection'
import { Either } from '@/library/either/Either'

const makeMockCollection = (overrides?: Partial<PaisCollection>): PaisCollection => ({
  findAll: vi.fn().mockResolvedValue(Either.right([])),
  findEstadosBySigla: vi.fn().mockResolvedValue(Either.right([])),
  ...overrides
})

describe('ListaEstadosPaisUseCase', () => {
  test('returns estados for a given país sigla', async () => {
    const expected = [
      {
        id: 1, nome: 'Paraná', sigla: 'PR'
      }
    ]
    const collection = makeMockCollection({
      findEstadosBySigla: vi.fn().mockResolvedValue(Either.right(expected))
    })

    const useCase = new ListaEstadosPaisUseCase({ paisCollection: collection })
    const result = await useCase.execute({ sigla: 'BRA' })

    expect(result.right()).toBe(true)
    expect(result.value).toEqual(expected)
  })

  test('calls the collection with the correct sigla', async () => {
    const collection = makeMockCollection()

    const useCase = new ListaEstadosPaisUseCase({ paisCollection: collection })
    await useCase.execute({ sigla: 'BRA' })

    expect(collection.findEstadosBySigla).toHaveBeenCalledWith({ sigla: 'BRA' })
  })

  test('returns empty list when país has no estados', async () => {
    const collection = makeMockCollection({
      findEstadosBySigla: vi.fn().mockResolvedValue(Either.right([]))
    })

    const useCase = new ListaEstadosPaisUseCase({ paisCollection: collection })
    const result = await useCase.execute({ sigla: 'XYZ' })

    expect(result.right()).toBe(true)
    expect(result.value).toHaveLength(0)
  })

  test('propagates collection error as Either.left', async () => {
    const error = new Error('DB failure')
    const collection = makeMockCollection({
      findEstadosBySigla: vi.fn().mockResolvedValue(Either.left(error))
    })

    const useCase = new ListaEstadosPaisUseCase({ paisCollection: collection })
    const result = await useCase.execute({ sigla: 'BRA' })

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
  })
})
