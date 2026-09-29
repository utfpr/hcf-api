import {
  describe, expect, test, vi
} from 'vitest'

import { BuscarEventoController } from '@/application/evento/BuscarEventoController'
import { BuscarEventoPorIdUseCase } from '@/domain/evento/BuscarEventoPorIdUseCase'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { NotFoundError } from '@/library/http/error/NotFoundError'

describe('BuscarEventoController', () => {
  const headers = {} as Headers

  test('returns 200 with body when use case finds event', async () => {
    const evento = {
      id: 1,
      expedicao_id: 10,
      tipo: 'DIARIO' as const,
      capturado_em: new Date('2026-09-15T10:00:00.000Z'),
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

    const buscarEventoPorIdUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(evento))
    } as unknown as BuscarEventoPorIdUseCase

    const controller = new BuscarEventoController({
      buscarEventoPorIdUseCase
    })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { eventoId: '1' },
      path: '/eventos/1'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(buscarEventoPorIdUseCase.execute).toHaveBeenCalledWith({
      id: 1
    })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Ok)
    expect('body' in response ? response.body : undefined).toEqual(evento)
  })

  test('returns BadRequest when eventoId is invalid', async () => {
    const buscarEventoPorIdUseCase = {
      execute: vi.fn()
    } as unknown as BuscarEventoPorIdUseCase

    const controller = new BuscarEventoController({
      buscarEventoPorIdUseCase
    })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { eventoId: 'abc' },
      path: '/eventos/abc'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(buscarEventoPorIdUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('returns NotFound when event does not exist', async () => {
    const buscarEventoPorIdUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(null))
    } as unknown as BuscarEventoPorIdUseCase

    const controller = new BuscarEventoController({
      buscarEventoPorIdUseCase
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
    const buscarEventoPorIdUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('boom')))
    } as unknown as BuscarEventoPorIdUseCase

    const controller = new BuscarEventoController({
      buscarEventoPorIdUseCase
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
