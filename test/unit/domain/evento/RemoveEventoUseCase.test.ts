import {
  describe, expect, test, vi
} from 'vitest'

import { EventoCollection } from '@/domain/evento/EventoCollection'
import { RemoveEventoUseCase } from '@/domain/evento/RemoveEventoUseCase'
import { Attributes as EvidenciaAttributes } from '@/domain/evidencia/Evidencia'
import { EvidenciaArquivo } from '@/domain/evidencia/EvidenciaArquivo'
import { EvidenciaCollection } from '@/domain/evidencia/EvidenciaCollection'
import { Either } from '@/library/either/Either'
import { Logger } from '@/library/logger/Logger'

const makeMockEventoCollection = (overrides?: Partial<EventoCollection>): EventoCollection => ({
  create: vi.fn(),
  delete: vi.fn().mockResolvedValue(Either.right(true)),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  ...overrides
})

const makeMockEvidenciaCollection = (overrides?: Partial<EvidenciaCollection>): EvidenciaCollection => ({
  create: vi.fn(),
  delete: vi.fn(),
  findAll: vi.fn().mockResolvedValue(Either.right([])),
  findById: vi.fn(),
  ...overrides
})

const makeMockEvidenciaArquivo = (overrides?: Partial<EvidenciaArquivo>): EvidenciaArquivo => ({
  remove: vi.fn().mockResolvedValue(Either.right(undefined)),
  save: vi.fn(),
  ...overrides
})

const makeMockLogger = (): Logger => ({
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
})

const makeEvidencia = (overrides?: Partial<EvidenciaAttributes>): EvidenciaAttributes => ({
  arquivo: 'foto.jpg',
  data_captura: new Date(),
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

describe('RemoveEventoUseCase', () => {
  test('retorna true quando o evento é removido', async () => {
    const eventoCollection = makeMockEventoCollection()
    const evidenciaCollection = makeMockEvidenciaCollection()
    const evidenciaArquivo = makeMockEvidenciaArquivo()
    const useCase = new RemoveEventoUseCase({
      eventoCollection, evidenciaArquivo, evidenciaCollection, logger: makeMockLogger()
    })

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
    const evidenciaArquivo = makeMockEvidenciaArquivo()
    const useCase = new RemoveEventoUseCase({
      eventoCollection, evidenciaArquivo, evidenciaCollection, logger: makeMockLogger()
    })

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
    const evidenciaArquivo = makeMockEvidenciaArquivo()
    const useCase = new RemoveEventoUseCase({
      eventoCollection, evidenciaArquivo, evidenciaCollection, logger: makeMockLogger()
    })

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
    const evidenciaArquivo = makeMockEvidenciaArquivo()
    const useCase = new RemoveEventoUseCase({
      eventoCollection, evidenciaArquivo, evidenciaCollection, logger: makeMockLogger()
    })

    const result = await useCase.execute({ id: 10 })

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
    expect(eventoCollection.delete).not.toHaveBeenCalled()
  })

  test('apaga os arquivos das evidências do evento removido', async () => {
    const evidencias = [
      makeEvidencia({ arquivo: 'foto1.jpg', id: 1 }),
      makeEvidencia({ arquivo: 'foto2.jpg', id: 2 })
    ]
    const eventoCollection = makeMockEventoCollection()
    const evidenciaCollection = makeMockEvidenciaCollection({
      findAll: vi.fn().mockResolvedValue(Either.right(evidencias))
    })
    const evidenciaArquivo = makeMockEvidenciaArquivo()
    const useCase = new RemoveEventoUseCase({
      eventoCollection, evidenciaArquivo, evidenciaCollection, logger: makeMockLogger()
    })

    const result = await useCase.execute({ id: 10 })

    expect(result.value).toBe(true)
    expect(evidenciaArquivo.remove).toHaveBeenCalledTimes(2)
    expect(evidenciaArquivo.remove).toHaveBeenCalledWith('foto1.jpg')
    expect(evidenciaArquivo.remove).toHaveBeenCalledWith('foto2.jpg')
  })

  test('não apaga arquivos quando o evento não é removido', async () => {
    const evidencias = [makeEvidencia({ arquivo: 'foto1.jpg' })]
    const eventoCollection = makeMockEventoCollection({
      delete: vi.fn().mockResolvedValue(Either.right(false))
    })
    const evidenciaCollection = makeMockEvidenciaCollection({
      findAll: vi.fn().mockResolvedValue(Either.right(evidencias))
    })
    const evidenciaArquivo = makeMockEvidenciaArquivo()
    const useCase = new RemoveEventoUseCase({
      eventoCollection, evidenciaArquivo, evidenciaCollection, logger: makeMockLogger()
    })

    await useCase.execute({ id: 10 })

    expect(evidenciaArquivo.remove).not.toHaveBeenCalled()
  })

  test('registra no log quando o arquivo de uma evidência não pode ser removido', async () => {
    const evidencias = [makeEvidencia({ arquivo: 'foto1.jpg' })]
    const eventoCollection = makeMockEventoCollection()
    const evidenciaCollection = makeMockEvidenciaCollection({
      findAll: vi.fn().mockResolvedValue(Either.right(evidencias))
    })
    const evidenciaArquivo = makeMockEvidenciaArquivo({
      remove: vi.fn().mockResolvedValue(Either.left(new Error('EACCES')))
    })
    const logger = makeMockLogger()
    const useCase = new RemoveEventoUseCase({
      eventoCollection, evidenciaArquivo, evidenciaCollection, logger
    })

    const result = await useCase.execute({ id: 10 })

    expect(result.value).toBe(true)
    expect(logger.error).toHaveBeenCalledWith(
      'Falha ao remover arquivo órfão de evidência',
      expect.objectContaining({ arquivo: 'foto1.jpg', evento_id: 10 })
    )
  })
})
