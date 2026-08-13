import {
  describe, expect, test, vi
} from 'vitest'

import { EstadoCollection } from '@/domain/estado/EstadoCollection'
import { ListaEstadosUseCase } from '@/domain/estado/ListaEstadosUseCase'
import { Either } from '@/library/either/Either'

const makeMockCollection = (overrides?: Partial<EstadoCollection>): EstadoCollection => ({
  findAll: vi.fn().mockResolvedValue(Either.right([])),
  ...overrides
})

describe('ListaEstadosUseCase', () => {
  test('returns estados for a given paisSigla', async () => {
    const expected = [
      {
        id: 1, nome: 'Paraná', sigla: 'PR'
      }
    ]
    const collection = makeMockCollection({
      findAll: vi.fn().mockResolvedValue(Either.right(expected))
    })

    const useCase = new ListaEstadosUseCase({ estadoCollection: collection })
    const result = await useCase.execute({ paisSigla: 'BRA' })

    expect(result.right()).toBe(true)
    expect(result.value).toEqual(expected)
  })

  test('forwards filters to the collection', async () => {
    const collection = makeMockCollection()

    const useCase = new ListaEstadosUseCase({ estadoCollection: collection })
    await useCase.execute({ paisSigla: 'BRA' })

    expect(collection.findAll).toHaveBeenCalledWith({ paisSigla: 'BRA' })
  })

  test('returns empty list when país has no estados', async () => {
    const collection = makeMockCollection({
      findAll: vi.fn().mockResolvedValue(Either.right([]))
    })

    const useCase = new ListaEstadosUseCase({ estadoCollection: collection })
    const result = await useCase.execute({ paisSigla: 'XYZ' })

    expect(result.right()).toBe(true)
    expect(result.value).toHaveLength(0)
  })

  test('propagates collection error as Either.left', async () => {
    const error = new Error('DB failure')
    const collection = makeMockCollection({
      findAll: vi.fn().mockResolvedValue(Either.left(error))
    })

    const useCase = new ListaEstadosUseCase({ estadoCollection: collection })
    const result = await useCase.execute({ paisSigla: 'BRA' })

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
  })
})
