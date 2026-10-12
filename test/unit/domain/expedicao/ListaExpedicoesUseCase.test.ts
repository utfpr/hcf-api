import {
  describe, expect, test, vi
} from 'vitest'

import {
  ExpedicaoCollection,
  ExpedicaoFilters,
  ExpedicaoListItem,
  Paginated
} from '@/domain/expedicao/ExpedicaoCollection'
import { ListaExpedicoesUseCase } from '@/domain/expedicao/ListaExpedicoesUseCase'
import { Either } from '@/library/either/Either'

const makeMockCollection = (overrides?: Partial<ExpedicaoCollection>): ExpedicaoCollection => ({
  findAll: vi.fn().mockResolvedValue(Either.right({
    itens: [],
    total: 0,
    limite: 20,
    pagina: 1
  })),
  findById: vi.fn(),
  create: vi.fn(),
  addParticipant: vi.fn(),
  removeParticipant: vi.fn(),
  substituteRoute: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  ...overrides
})

describe('ListaExpedicoesUseCase', () => {
  test('returns paginated items when collection succeeds', async () => {
    const expected: Paginated<ExpedicaoListItem> = {
      itens: [
        {
          id: 1,
          descricao: 'Expedição 1',
          data_inicio: '2026-10-01',
          data_fim: '2026-10-10',
          cidade_id: 100,
          created_at: new Date('2026-10-01T00:00:00.000Z'),
          updated_at: new Date('2026-10-01T00:00:00.000Z'),
          created_by: null,
          updated_by: null,
          cidade_nome: 'Curitiba',
          estado_sigla: 'PR',
          participantes: [],
          rotas: []
        }
      ],
      total: 1,
      limite: 20,
      pagina: 1
    }

    const collection = makeMockCollection({
      findAll: vi.fn().mockResolvedValue(Either.right(expected))
    })

    const useCase = new ListaExpedicoesUseCase({ expedicaoCollection: collection })
    const filters: ExpedicaoFilters = {
      data_fim_de: '2026-10-04',
      order: { column: 'data_inicio', direction: 'asc' }
    }

    const result = await useCase.execute(filters)

    expect(collection.findAll).toHaveBeenCalledWith(filters)
    expect(result.right()).toBe(true)
    expect(result.value).toEqual(expected)
  })

  test('propagates collection error as Either.left', async () => {
    const error = new Error('DB query error')
    const collection = makeMockCollection({
      findAll: vi.fn().mockResolvedValue(Either.left(error))
    })

    const useCase = new ListaExpedicoesUseCase({ expedicaoCollection: collection })
    const result = await useCase.execute({})

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
  })
})
