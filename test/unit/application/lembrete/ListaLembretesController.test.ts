import {
  describe, expect, test, vi
} from 'vitest'

import { ListaLembretesController } from '@/application/lembrete/ListaLembretesController'
import { LembreteCollection } from '@/domain/lembrete/LembreteCollection'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { InternalServerError } from '@/library/http/error/InternalServerError'

const headers = {} as Headers

function makeRequest(params: Record<string, unknown>): HttpRequest {
  return {
    body: undefined, headers, method: Method.Get, params, path: '/v1/lembretes'
  } satisfies HttpRequest
}

const pagina = {
  itens: [], total: 0, limite: 20, pagina: 1
}

describe('ListaLembretesController', () => {
  test('repassa filtros de data, ordenação e paginação', async () => {
    const lembreteCollection = {
      findAll: vi.fn().mockResolvedValue(Either.right(pagina))
    } as unknown as LembreteCollection

    const controller = new ListaLembretesController({ lembreteCollection })
    const response = await controller.handle(makeRequest({
      data_coleta_ate: '2026-12-31',
      data_coleta_de: '2026-10-05',
      limite: '10',
      order: 'data_coleta:desc',
      pagina: '2'
    }), vi.fn())

    expect(lembreteCollection.findAll).toHaveBeenCalledWith({
      data_coleta_ate: '2026-12-31',
      data_coleta_de: '2026-10-05',
      limite: 10,
      order: { column: 'data_coleta', direction: 'desc' },
      pagina: 2
    })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Ok)
  })

  test('retorna 400 quando data_coleta_de é inválida', async () => {
    const lembreteCollection = { findAll: vi.fn() } as unknown as LembreteCollection
    const controller = new ListaLembretesController({ lembreteCollection })

    const response = await controller.handle(makeRequest({ data_coleta_de: 'ontem' }), vi.fn())

    expect(lembreteCollection.findAll).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 400 quando order é inválido', async () => {
    const lembreteCollection = { findAll: vi.fn() } as unknown as LembreteCollection
    const controller = new ListaLembretesController({ lembreteCollection })

    const response = await controller.handle(makeRequest({ order: 'familia:asc' }), vi.fn())

    expect(lembreteCollection.findAll).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 500 quando a collection falha', async () => {
    const lembreteCollection = {
      findAll: vi.fn().mockResolvedValue(Either.left(new Error('DB failure')))
    } as unknown as LembreteCollection

    const controller = new ListaLembretesController({ lembreteCollection })
    const response = await controller.handle(makeRequest({}), vi.fn())

    expect(response).toBeInstanceOf(InternalServerError)
  })

  test('filtra pela expedição de origem', async () => {
    const lembreteCollection = {
      findAll: vi.fn().mockResolvedValue(Either.right(pagina))
    } as unknown as LembreteCollection

    const controller = new ListaLembretesController({ lembreteCollection })
    await controller.handle(makeRequest({ expedicao_id: '3', data_coleta_de: '2026-10-21' }), vi.fn())

    expect(lembreteCollection.findAll).toHaveBeenCalledWith({ expedicao_id: 3, data_coleta_de: '2026-10-21' })
  })

  test('retorna 400 quando expedicao_id é inválido', async () => {
    const lembreteCollection = { findAll: vi.fn() } as unknown as LembreteCollection

    const controller = new ListaLembretesController({ lembreteCollection })
    const response = await controller.handle(makeRequest({ expedicao_id: 'abc' }), vi.fn())

    expect(lembreteCollection.findAll).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })
})
