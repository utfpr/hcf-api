import {
  describe,
  expect,
  test,
  vi
} from 'vitest'

import { ListaEventosController } from '@/application/evento/ListaEventosController'
import { ListaEventosUseCase } from '@/domain/evento/ListaEventosUseCase'
import { Either } from '@/library/either/Either'
import {
  Headers,
  HttpRequest,
  Method,
  StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { InternalServerError } from '@/library/http/error/InternalServerError'

const headers: Headers = {
  'Content-Length': 0,
  'Content-Type': 'application/json'
}

describe('ListaEventosController', () => {
  test('returns 200 with body when use case succeeds', async () => {
    const lista = [
      {
        id: 1,
        expedicao_id: 10,
        tipo: 'DIARIO' as const,
        capturado_em: new Date('2026-09-01T10:00:00.000Z')
      }
    ]

    const resultado = {
      itens: lista,
      total: 1,
      limite: 20,
      pagina: 1
    }

    const listaEventosUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(resultado))
    } as unknown as ListaEventosUseCase

    const controller = new ListaEventosController({ listaEventosUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: {
        expedicaoId: '10'
      },
      path: '/expedicoes/10/eventos'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(response).toEqual({
      statusCode: StatusCode.Ok,
      body: resultado
    })
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
      params: {
        expedicaoId: 'abc'
      },
      path: '/expedicoes/abc/eventos'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(response).toBeInstanceOf(BadRequestError)
    expect(listaEventosUseCase.execute).not.toHaveBeenCalled()
  })

  test('returns InternalServerError when use case fails', async () => {
    const listaEventosUseCase = {
      execute: vi.fn().mockResolvedValue(
        Either.left(new Error('erro ao listar eventos'))
      )
    } as unknown as ListaEventosUseCase

    const controller = new ListaEventosController({ listaEventosUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: {
        expedicaoId: '10'
      },
      path: '/expedicoes/10/eventos'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(response).toBeInstanceOf(InternalServerError)
  })

  test('passes filters and pagination to use case', async () => {
    const resultado = {
      itens: [],
      total: 0,
      limite: 10,
      pagina: 2
    }

    const listaEventosUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(resultado))
    } as unknown as ListaEventosUseCase

    const controller = new ListaEventosController({ listaEventosUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: {
        expedicaoId: '10',
        tipo: 'COLETA',
        capturado_de: '2026-09-01T00:00:00.000Z',
        capturado_ate: '2026-09-15T23:59:59.999Z',
        limite: '10',
        pagina: '2'
      },
      path: '/expedicoes/10/eventos'
    } satisfies HttpRequest

    await controller.handle(request, vi.fn())

    expect(listaEventosUseCase.execute).toHaveBeenCalledWith({
      expedicao_id: 10,
      tipo: 'COLETA',
      capturado_de: new Date('2026-09-01T00:00:00.000Z'),
      capturado_ate: new Date('2026-09-15T23:59:59.999Z'),
      limite: 10,
      pagina: 2
    })
  })
})
