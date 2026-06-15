import {
  describe, expect, test, vi
} from 'vitest'

import { ListaEstadosController } from '@/application/estado/ListaEstadosController'
import { ListaEstadosUseCase } from '@/domain/estado/ListaEstadosUseCase'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'

describe('ListaEstadosController', () => {
  const headers = {} as Headers

  test('returns 200 with body when use case succeeds', async () => {
    const lista = [
      {
        id: 1, nome: 'PR', sigla: 'PR'
      }
    ]

    const listaEstadosUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(lista))
    } as unknown as ListaEstadosUseCase

    const controller = new ListaEstadosController({ listaEstadosUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { paisSigla: 'BRA' },
      path: '/paises/BRA/estados'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(listaEstadosUseCase.execute).toHaveBeenCalledWith({ paisSigla: 'BRA' })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Ok)
    expect('body' in response ? response.body : undefined).toEqual(lista)
  })

  test('returns BadRequest when paisSigla is missing', async () => {
    const listaEstadosUseCase = {
      execute: vi.fn()
    } as unknown as ListaEstadosUseCase

    const controller = new ListaEstadosController({ listaEstadosUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: {},
      path: '/paises//estados'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(listaEstadosUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('returns InternalServerError when use case fails', async () => {
    const listaEstadosUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('boom')))
    } as unknown as ListaEstadosUseCase

    const controller = new ListaEstadosController({ listaEstadosUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: { paisSigla: 'BRA' },
      path: '/paises/BRA/estados'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect((response as Error).name).toBe('InternalServerError')
  })
})
