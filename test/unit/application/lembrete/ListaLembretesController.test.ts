import {
  describe, expect, test, vi
} from 'vitest'

import { ListaLembretesController } from '@/application/lembrete/ListaLembretesController'
import { LembreteCollection } from '@/domain/lembrete/LembreteCollection'
import { LembreteEvidenciaCollection } from '@/domain/lembrete/LembreteEvidenciaCollection'
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

const lembreteEvidenciaCollection = {
  findAll: vi.fn().mockResolvedValue(Either.right([]))
} as unknown as LembreteEvidenciaCollection

const pagina = {
  itens: [], total: 0, limite: 20, pagina: 1
}

describe('ListaLembretesController', () => {
  test('repassa filtros de data, ordenação e paginação', async () => {
    const lembreteCollection = {
      findAll: vi.fn().mockResolvedValue(Either.right(pagina))
    } as unknown as LembreteCollection

    const controller = new ListaLembretesController({ lembreteCollection, lembreteEvidenciaCollection })
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
    const controller = new ListaLembretesController({ lembreteCollection, lembreteEvidenciaCollection })

    const response = await controller.handle(makeRequest({ data_coleta_de: 'ontem' }), vi.fn())

    expect(lembreteCollection.findAll).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 400 quando order é inválido', async () => {
    const lembreteCollection = { findAll: vi.fn() } as unknown as LembreteCollection
    const controller = new ListaLembretesController({ lembreteCollection, lembreteEvidenciaCollection })

    const response = await controller.handle(makeRequest({ order: 'familia:asc' }), vi.fn())

    expect(lembreteCollection.findAll).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 500 quando a collection falha', async () => {
    const lembreteCollection = {
      findAll: vi.fn().mockResolvedValue(Either.left(new Error('DB failure')))
    } as unknown as LembreteCollection

    const controller = new ListaLembretesController({ lembreteCollection, lembreteEvidenciaCollection })
    const response = await controller.handle(makeRequest({}), vi.fn())

    expect(response).toBeInstanceOf(InternalServerError)
  })

  test('filtra pela expedição de origem', async () => {
    const lembreteCollection = {
      findAll: vi.fn().mockResolvedValue(Either.right(pagina))
    } as unknown as LembreteCollection

    const controller = new ListaLembretesController({ lembreteCollection, lembreteEvidenciaCollection })
    await controller.handle(makeRequest({ expedicao_id: '3', data_coleta_de: '2026-10-21' }), vi.fn())

    expect(lembreteCollection.findAll).toHaveBeenCalledWith({ expedicao_id: 3, data_coleta_de: '2026-10-21' })
  })

  test('retorna 400 quando expedicao_id é inválido', async () => {
    const lembreteCollection = { findAll: vi.fn() } as unknown as LembreteCollection

    const controller = new ListaLembretesController({ lembreteCollection, lembreteEvidenciaCollection })
    const response = await controller.handle(makeRequest({ expedicao_id: 'abc' }), vi.fn())

    expect(lembreteCollection.findAll).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('anexa a cada lembrete as fotos dele com a url', async () => {
    const lembreteCollection = {
      findAll: vi.fn().mockResolvedValue(Either.right({ ...pagina, itens: [{ id: 1 }, { id: 2 }] }))
    } as unknown as LembreteCollection
    const evidencias = {
      findAll: vi.fn().mockResolvedValue(Either.right([
        { id: 10, lembrete_id: 2, arquivo: 'lembrete_2_1-ab12.jpg' }
      ]))
    } as unknown as LembreteEvidenciaCollection

    const controller = new ListaLembretesController({ lembreteCollection, lembreteEvidenciaCollection: evidencias })
    const response = await controller.handle(makeRequest({}), vi.fn())

    expect(evidencias.findAll).toHaveBeenCalledWith({ lembrete_ids: [1, 2] })
    const { itens } = (response as { body: { itens: Array<{ id: number, evidencias: unknown[] }> } }).body
    expect(itens[0].evidencias).toEqual([])
    expect(itens[1].evidencias).toEqual([
      {
        id: 10, lembrete_id: 2, arquivo: 'lembrete_2_1-ab12.jpg', url: '/uploads/lembretes/lembrete_2_1-ab12.jpg'
      }
    ])
  })
})
