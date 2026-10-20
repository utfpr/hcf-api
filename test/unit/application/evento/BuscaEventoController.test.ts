import {
  describe, expect, test, vi
} from 'vitest'

import { BuscaEventoController } from '@/application/evento/BuscaEventoController'
import { BuscaEventoPorIdUseCase } from '@/domain/evento/BuscaEventoPorIdUseCase'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { NotFoundError } from '@/library/http/error/NotFoundError'

describe('BuscaEventoController', () => {
  const headers = {} as Headers

  test('returns 200 with body when use case finds event', async () => {
    const evento = {
      id: 1,
      expedicao_id: 10,
      tipo: 'DIARIO' as const,
      data_captura: new Date('2026-09-15T10:00:00.000Z'),
      latitude: null,
      longitude: null,
      altitude: null,
      observacoes: 'Observação',
      coleta: null,
      created_at: new Date('2026-09-15T10:00:00.000Z'),
      updated_at: new Date('2026-09-15T10:00:00.000Z'),
      created_by: null,
      updated_by: null
    }

    const buscaEventoPorIdUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(evento))
    } as unknown as BuscaEventoPorIdUseCase

    const controller = new BuscaEventoController({
      buscaEventoPorIdUseCase
    })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { eventoId: '1' },
      path: '/eventos/1'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(buscaEventoPorIdUseCase.execute).toHaveBeenCalledWith({
      id: 1
    })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Ok)
    expect('body' in response ? response.body : undefined).toEqual(evento)
  })

  test('returns BadRequest when eventoId is invalid', async () => {
    const buscaEventoPorIdUseCase = {
      execute: vi.fn()
    } as unknown as BuscaEventoPorIdUseCase

    const controller = new BuscaEventoController({
      buscaEventoPorIdUseCase
    })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { eventoId: 'abc' },
      path: '/eventos/abc'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(buscaEventoPorIdUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('returns NotFound when event does not exist', async () => {
    const buscaEventoPorIdUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(null))
    } as unknown as BuscaEventoPorIdUseCase

    const controller = new BuscaEventoController({
      buscaEventoPorIdUseCase
    })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { eventoId: '1' },
      path: '/eventos/1'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(response).toBeInstanceOf(NotFoundError)
  })

  test('returns InternalServerError when use case fails', async () => {
    const buscaEventoPorIdUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('boom')))
    } as unknown as BuscaEventoPorIdUseCase

    const controller = new BuscaEventoController({
      buscaEventoPorIdUseCase
    })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { eventoId: '1' },
      path: '/eventos/1'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect((response as Error).name).toBe('InternalServerError')
  })
})
