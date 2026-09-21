import {
  describe, expect, test, vi
} from 'vitest'

import { ListaEventosController } from '@/application/evento/ListaEventosController'
import { ListaEventosUseCase } from '@/domain/evento/ListaEventosUseCase'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'

describe('ListaEventosController', () => {
  const headers = {} as Headers

  test('returns 200 with body when use case succeeds', async () => {
    const lista = [
      {
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
    ]

    const listaEventosUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(lista))
    } as unknown as ListaEventosUseCase

    const controller = new ListaEventosController({ listaEventosUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { expedicaoId: '10' },
      path: '/expedicoes/10/eventos'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(listaEventosUseCase.execute).toHaveBeenCalledWith({
      expedicao_id: 10
    })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Ok)
    expect('body' in response ? response.body : undefined).toEqual(lista)
  })

  test('returns BadRequest when expedicaoId is invalid', async () => {
    const listaEventosUseCase = {
      execute: vi.fn()
    } as unknown as ListaEventosUseCase

    const controller = new ListaEventosController({ listaEventosUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { expedicaoId: 'abc' },
      path: '/expedicoes/abc/eventos'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(listaEventosUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('returns InternalServerError when use case fails', async () => {
    const listaEventosUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('boom')))
    } as unknown as ListaEventosUseCase

    const controller = new ListaEventosController({ listaEventosUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { expedicaoId: '10' },
      path: '/expedicoes/10/eventos'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect((response as Error).name).toBe('InternalServerError')
  })
})
