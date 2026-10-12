import {
  describe, expect, test, vi
} from 'vitest'

import { AtualizaLembreteUseCase } from '@/domain/lembrete/AtualizaLembreteUseCase'
import { Attributes } from '@/domain/lembrete/Lembrete'
import { LembreteCollection } from '@/domain/lembrete/LembreteCollection'
import { Either } from '@/library/either/Either'

const existente: Attributes = {
  id: 10,
  data_coleta: '2026-11-20',
  local_coleta: 'Serra do Cipó',
  familia: 'Velloziaceae',
  nome_popular: null,
  nome_cientifico: 'Vellozia squamata',
  municipio: null,
  estado: 'MG',
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
  luminosidade: null,
  created_at: new Date(),
  updated_at: new Date(),
  created_by: null,
  updated_by: null
}

const makeMockCollection = (overrides?: Partial<LembreteCollection>): LembreteCollection => ({
  create: vi.fn(),
  delete: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn().mockResolvedValue(Either.right(existente)),
  update: vi.fn().mockImplementation((_id, patch) => Promise.resolve(Either.right({ ...existente, ...patch }))),
  ...overrides
})

describe('AtualizaLembreteUseCase', () => {
  test('mantém os campos ausentes e troca só os enviados', async () => {
    const collection = makeMockCollection()
    const useCase = new AtualizaLembreteUseCase({ lembreteCollection: collection })

    const result = await useCase.execute({
      data_coleta: '2026-12-01',
      flores: 'Lilases',
      id: 10,
      nome_cientifico: null,
      updated_by: null
    })

    expect(result.right()).toBe(true)
    expect(collection.update).toHaveBeenCalledWith(10, expect.objectContaining({
      data_coleta: '2026-12-01',
      familia: 'Velloziaceae',
      flores: 'Lilases',
      local_coleta: 'Serra do Cipó',
      nome_cientifico: null
    }))
  })

  test('retorna null quando o lembrete não existe', async () => {
    const collection = makeMockCollection({
      findById: vi.fn().mockResolvedValue(Either.right(null))
    })
    const useCase = new AtualizaLembreteUseCase({ lembreteCollection: collection })

    const result = await useCase.execute({ id: 99, updated_by: null })

    expect(result.right()).toBe(true)
    expect(result.value).toBeNull()
    expect(collection.update).not.toHaveBeenCalled()
  })

  test('não persiste quando o estado mesclado é inválido', async () => {
    const collection = makeMockCollection()
    const useCase = new AtualizaLembreteUseCase({ lembreteCollection: collection })

    const result = await useCase.execute({
      id: 10, local_coleta: '', updated_by: null
    })

    expect(result.left()).toBe(true)
    expect(collection.update).not.toHaveBeenCalled()
  })
})
