import {
  describe, expect, test, vi
} from 'vitest'

import { AtualizarEventoController } from '@/application/evento/AtualizarEventoController'
import { AtualizarEventoUseCase } from '@/domain/evento/AtualizarEventoUseCase'
import { Attributes } from '@/domain/evento/Evento'
import { CheckViolationError } from '@/infrastructure/error/CheckViolationError'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { UnprocessableEntityError } from '@/library/http/error/UnprocessableEntityError'

const headers = {} as Headers

const attributes: Attributes = {
  altitude: null,
  capturado_em: new Date('2026-02-15T14:32:00Z'),
  coleta: null,
  created_at: new Date(),
  created_by: null,
  expedicao_id: 1,
  id: 10,
  latitude: -21,
  longitude: -46.4167,
  observacoes: 'Solo arenoso',
  tipo: 'DIARIO',
  updated_at: new Date(),
  updated_by: null
}

function makeRequest(params: Record<string, unknown>, body: unknown): HttpRequest {
  return {
    body, headers, method: Method.Put, params, path: '/v2/eventos/10'
  } satisfies HttpRequest
}

describe('AtualizarEventoController', () => {
  test('retorna 200 com o evento atualizado', async () => {
    const atualizarEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(attributes))
    } as unknown as AtualizarEventoUseCase

    const controller = new AtualizarEventoController({ atualizarEventoUseCase })
    const response = await controller.handle(makeRequest({ eventoId: '10' }, { latitude: -21 }), vi.fn())

    expect(atualizarEventoUseCase.execute).toHaveBeenCalledWith({
      id: 10, latitude: -21, updated_by: null
    })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Ok)
    expect('body' in response ? response.body : undefined).toEqual(attributes)
  })

  test('só envia os campos presentes no corpo (atualização parcial)', async () => {
    const atualizarEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(attributes))
    } as unknown as AtualizarEventoUseCase

    const controller = new AtualizarEventoController({ atualizarEventoUseCase })
    await controller.handle(makeRequest({ eventoId: '10' }, { observacoes: 'novo texto' }), vi.fn())

    expect(atualizarEventoUseCase.execute).toHaveBeenCalledWith({
      id: 10, observacoes: 'novo texto', updated_by: null
    })
  })

  test('aceita a troca de tipo para DIARIO sem exigir coleta no corpo', async () => {
    const atualizarEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(attributes))
    } as unknown as AtualizarEventoUseCase

    const controller = new AtualizarEventoController({ atualizarEventoUseCase })
    await controller.handle(makeRequest({ eventoId: '10' }, { tipo: 'DIARIO' }), vi.fn())

    expect(atualizarEventoUseCase.execute).toHaveBeenCalledWith({
      id: 10, tipo: 'DIARIO', updated_by: null
    })
  })

  test('retorna 400 quando eventoId é inválido', async () => {
    const atualizarEventoUseCase = { execute: vi.fn() } as unknown as AtualizarEventoUseCase
    const controller = new AtualizarEventoController({ atualizarEventoUseCase })

    const response = await controller.handle(makeRequest({ eventoId: 'abc' }, {}), vi.fn())

    expect(atualizarEventoUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 404 quando o evento não existe', async () => {
    const atualizarEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(null))
    } as unknown as AtualizarEventoUseCase

    const controller = new AtualizarEventoController({ atualizarEventoUseCase })
    const response = await controller.handle(makeRequest({ eventoId: '999' }, { latitude: -21 }), vi.fn())

    expect(response).toBeInstanceOf(NotFoundError)
  })

  test('retorna 400 quando a validação de domínio falha', async () => {
    const atualizarEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('Latitude do evento deve estar entre -90 e 90')))
    } as unknown as AtualizarEventoUseCase

    const controller = new AtualizarEventoController({ atualizarEventoUseCase })
    const response = await controller.handle(makeRequest({ eventoId: '10' }, { latitude: 999 }), vi.fn())

    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 422 quando o banco rejeita o tipo (CheckViolationError)', async () => {
    const atualizarEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new CheckViolationError({ message: 'tipo inválido' })))
    } as unknown as AtualizarEventoUseCase

    const controller = new AtualizarEventoController({ atualizarEventoUseCase })
    const response = await controller.handle(makeRequest({ eventoId: '10' }, { tipo: 'DIARIO' }), vi.fn())

    expect(response).toBeInstanceOf(UnprocessableEntityError)
  })
})
