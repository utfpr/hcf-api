import {
  describe,
  expect,
  test,
  vi
} from 'vitest'

import { ListaEventosController } from '@/application/evento/ListaEventosController'
import { EventoCollection } from '@/domain/evento/EventoCollection'
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
        data_captura: new Date('2026-09-01T10:00:00.000Z')
      }
    ]

    const resultado = {
      itens: lista,
      total: 1,
      limite: 20,
      pagina: 1
    }

    const eventoCollection = {
      findAll: vi.fn().mockResolvedValue(Either.right(resultado))
    } as unknown as EventoCollection

    const controller = new ListaEventosController({ eventoCollection })

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
    const eventoCollection = {
      findAll: vi.fn()
    } as unknown as EventoCollection

    const controller = new ListaEventosController({ eventoCollection })

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
    expect(eventoCollection.findAll).not.toHaveBeenCalled()
  })

  test('returns InternalServerError when use case fails', async () => {
    const eventoCollection = {
      findAll: vi.fn().mockResolvedValue(
        Either.left(new Error('erro ao listar eventos'))
      )
    } as unknown as EventoCollection

    const controller = new ListaEventosController({ eventoCollection })

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

    const eventoCollection = {
      findAll: vi.fn().mockResolvedValue(Either.right(resultado))
    } as unknown as EventoCollection

    const controller = new ListaEventosController({ eventoCollection })

    const request = {
      body: {},
      headers,
      method: Method.Get,
      params: {
        expedicaoId: '10',
        tipo: 'COLETA',
        data_captura_de: '2026-09-01T00:00:00.000Z',
        data_captura_ate: '2026-09-15T23:59:59.999Z',
        limite: '10',
        pagina: '2'
      },
      path: '/expedicoes/10/eventos'
    } satisfies HttpRequest

    await controller.handle(request, vi.fn())

    expect(eventoCollection.findAll).toHaveBeenCalledWith({
      expedicao_id: 10,
      tipo: 'COLETA',
      data_captura_de: new Date('2026-09-01T00:00:00.000Z'),
      data_captura_ate: new Date('2026-09-15T23:59:59.999Z'),
      limite: 10,
      pagina: 2
    })
  })
})
