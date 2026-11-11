import {
  describe, expect, test, vi
} from 'vitest'

import { EventoNaoEncontradoError } from '@/domain/evento/error/EventoNaoEncontradoError'
import { Attributes as EventoAttributes } from '@/domain/evento/Evento'
import { EventoCollection } from '@/domain/evento/EventoCollection'
import { CriaEvidenciaUseCase, Input } from '@/domain/evidencia/CriaEvidenciaUseCase'
import { EvidenciaArquivo } from '@/domain/evidencia/EvidenciaArquivo'
import { EvidenciaCollection } from '@/domain/evidencia/EvidenciaCollection'
import { Either } from '@/library/either/Either'
import { Logger } from '@/library/logger/Logger'

const evento: EventoAttributes = {
  altitude: null,
  coleta: null,
  created_at: new Date(),
  created_by: 7,
  data_captura: new Date('2026-02-15T13:15:00.000Z'),
  expedicao_id: 3,
  id: 10,
  latitude: null,
  longitude: null,
  observacoes: null,
  tipo: 'DIARIO',
  updated_at: new Date(),
  updated_by: 7
}

const input: Input = {
  contents: Buffer.from('conteúdo'),
  created_by: 7,
  data_captura: new Date('2026-02-15T14:32:00.000Z'),
  evento_id: 10,
  mime_type: 'image/jpeg',
  nome: 'IMG_0042.jpg'
}

const arquivoSalvo = { arquivo: '3_10_1771166000000-a1b2.jpg', tamanho: 8 }

function makeDependencies(overrides?: {
  eventoCollection?: Partial<EventoCollection>
  evidenciaCollection?: Partial<EvidenciaCollection>
  evidenciaArquivo?: Partial<EvidenciaArquivo>
}) {
  const eventoCollection = {
    findById: vi.fn().mockResolvedValue(Either.right(evento)),
    ...overrides?.eventoCollection
  } as unknown as EventoCollection
  const evidenciaCollection = {
    create: vi.fn().mockImplementation(attributes => Promise.resolve(Either.right({ ...attributes, id: 1 }))),
    ...overrides?.evidenciaCollection
  } as unknown as EvidenciaCollection
  const evidenciaArquivo: EvidenciaArquivo = {
    remove: vi.fn().mockResolvedValue(Either.right(undefined)),
    save: vi.fn().mockResolvedValue(Either.right(arquivoSalvo)),
    ...overrides?.evidenciaArquivo
  }
  const logger: Logger = {
    debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn()
  }

  return {
    eventoCollection, evidenciaArquivo, evidenciaCollection, logger
  }
}

describe('CriaEvidenciaUseCase', () => {
  test('grava o arquivo com os ids do evento e persiste a evidência', async () => {
    const dependencies = makeDependencies()
    const useCase = new CriaEvidenciaUseCase(dependencies)

    const result = await useCase.execute(input)

    expect(result.right()).toBe(true)
    expect(dependencies.evidenciaArquivo.save).toHaveBeenCalledWith({
      contents: input.contents, eventoId: 10, expedicaoId: 3, mimeType: 'image/jpeg'
    })
    expect(dependencies.evidenciaCollection.create).toHaveBeenCalledWith(expect.objectContaining({
      arquivo: arquivoSalvo.arquivo, evento_id: 10, tamanho: arquivoSalvo.tamanho
    }))
  })

  test('retorna EventoNaoEncontradoError sem gravar o arquivo quando o evento não existe', async () => {
    const dependencies = makeDependencies({
      eventoCollection: { findById: vi.fn().mockResolvedValue(Either.right(null)) }
    })
    const useCase = new CriaEvidenciaUseCase(dependencies)

    const result = await useCase.execute(input)

    expect(result.value).toBeInstanceOf(EventoNaoEncontradoError)
    expect(dependencies.evidenciaArquivo.save).not.toHaveBeenCalled()
  })

  test('descarta o arquivo gravado quando a persistência falha', async () => {
    const error = new Error('DB failure')
    const dependencies = makeDependencies({
      evidenciaCollection: { create: vi.fn().mockResolvedValue(Either.left(error)) }
    })
    const useCase = new CriaEvidenciaUseCase(dependencies)

    const result = await useCase.execute(input)

    expect(result.value).toBe(error)
    expect(dependencies.evidenciaArquivo.remove).toHaveBeenCalledWith(arquivoSalvo.arquivo)
  })

  test('descarta o arquivo gravado quando a evidência é inválida', async () => {
    const dependencies = makeDependencies()
    const useCase = new CriaEvidenciaUseCase(dependencies)

    const result = await useCase.execute({ ...input, nome: '   ' })

    expect(result.left()).toBe(true)
    expect(dependencies.evidenciaArquivo.remove).toHaveBeenCalledWith(arquivoSalvo.arquivo)
    expect(dependencies.evidenciaCollection.create).not.toHaveBeenCalled()
  })
})
