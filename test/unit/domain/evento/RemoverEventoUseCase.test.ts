import path from 'node:path'

import {
  beforeEach, describe, expect, test, vi
} from 'vitest'

import { Attributes as EvidenciaAttributes } from '@/domain/evidencia/Evidencia'
import { EvidenciaCollection } from '@/domain/evidencia/EvidenciaCollection'
import { EventoCollection } from '@/domain/evento/EventoCollection'
import { RemoverEventoUseCase } from '@/domain/evento/RemoverEventoUseCase'
import { Either } from '@/library/either/Either'

const { unlinkMock } = vi.hoisted(() => ({
  unlinkMock: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('node:fs/promises', () => ({
  unlink: unlinkMock
}))

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'evidencias')

const makeMockEventoCollection = (overrides?: Partial<EventoCollection>): EventoCollection =>
({
  create: vi.fn(),
  delete: vi.fn().mockResolvedValue(Either.right(true)),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  ...overrides
})

const makeMockEvidenciaCollection = (overrides?: Partial<EvidenciaCollection>): EvidenciaCollection =>
({
  create: vi.fn(),
  delete: vi.fn(),
  findAll: vi.fn().mockResolvedValue(Either.right([])),
  findById: vi.fn(),
  ...overrides
})

const makeEvidencia = (overrides?: Partial<EvidenciaAttributes>): EvidenciaAttributes =>
({
  arquivo: 'foto.jpg',
  capturado_em: new Date(),
  created_at: new Date(),
  created_by: null,
  evento_id: 10,
  id: 1,
  mime_type: 'image/jpeg',
  nome: 'Foto',
  tamanho: 1234,
  updated_at: new Date(),
  updated_by: null,
  ...overrides
})

describe('RemoverEventoUseCase', () => {
  beforeEach(() => {
    unlinkMock.mockReset()
    unlinkMock.mockResolvedValue(undefined)
  })

  test('retorna true quando o evento é removido', async () => {
    const eventoCollection = makeMockEventoCollection()
    const evidenciaCollection = makeMockEvidenciaCollection()
    const useCase = new RemoverEventoUseCase({ eventoCollection, evidenciaCollection })

    const result = await useCase.execute({ id: 10 })

    expect(result.right()).toBe(true)
    expect(result.value).toBe(true)
    expect(evidenciaCollection.findAll).toHaveBeenCalledWith({ evento_id: 10 })
    expect(eventoCollection.delete).toHaveBeenCalledWith(10)
  })

  test('retorna false quando o evento não existe', async () => {
    const eventoCollection = makeMockEventoCollection({
      delete: vi.fn().mockResolvedValue(Either.right(false))
    })
    const evidenciaCollection = makeMockEvidenciaCollection()
    const useCase = new RemoverEventoUseCase({ eventoCollection, evidenciaCollection })

    const result = await useCase.execute({ id: 999 })

    expect(result.right()).toBe(true)
    expect(result.value).toBe(false)
  })

  test('propaga erro de infraestrutura', async () => {
    const error = new Error('DB failure')
    const eventoCollection = makeMockEventoCollection({
      delete: vi.fn().mockResolvedValue(Either.left(error))
    })
    const evidenciaCollection = makeMockEvidenciaCollection()
    const useCase = new RemoverEventoUseCase({ eventoCollection, evidenciaCollection })

    const result = await useCase.execute({ id: 10 })

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
  })

  test('propaga erro quando busca das evidências falha', async () => {
    const error = new Error('DB failure ao buscar evidências')
    const eventoCollection = makeMockEventoCollection()
    const evidenciaCollection = makeMockEvidenciaCollection({
      findAll: vi.fn().mockResolvedValue(Either.left(error))
    })
    const useCase = new RemoverEventoUseCase({ eventoCollection, evidenciaCollection })

    const result = await useCase.execute({ id: 10 })

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
    expect(eventoCollection.delete).not.toHaveBeenCalled()
  })

  test('apaga os arquivos das evidências do evento removido', async() => {
    const evidencias = [
      makeEvidencia({ arquivo: 'foto1.jpg', id: 1 }),
      makeEvidencia({ arquivo: 'foto2.jpg', id: 2 })
    ]
    const eventoCollection = makeMockEventoCollection()
    const evidenciaCollection = makeMockEvidenciaCollection({
      findAll: vi.fn().mockResolvedValue(Either.right(evidencias))
    })
    const useCase = new RemoverEventoUseCase({ eventoCollection, evidenciaCollection })

    const result = await useCase.execute({ id: 10 })

    expect(result.value).toBe(true)
    expect(unlinkMock).toHaveBeenCalledTimes(2)
    expect(unlinkMock).toHaveBeenCalledWith(path.join(UPLOADS_DIR, 'foto1.jpg'))
    expect(unlinkMock).toHaveBeenCalledWith(path.join(UPLOADS_DIR, 'foto2.jpg'))
  })

  test('não apaga arquivos quando o evento não é removido', async () => {
    const evidencias = [makeEvidencia({ arquivo: 'foto1.jpg '})]
    const eventoCollection = makeMockEventoCollection({
      delete: vi.fn().mockResolvedValue(Either.right(false))
    })
    const evidenciaCollection = makeMockEvidenciaCollection({
      findAll: vi.fn().mockResolvedValue(Either.right(evidencias))
    })
    const useCase = new RemoverEventoUseCase({ eventoCollection, evidenciaCollection })

    await useCase.execute({ id: 10 })

    expect(unlinkMock).not.toHaveBeenCalled()
  })
})
