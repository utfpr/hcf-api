import {
  describe, expect, test, vi
} from 'vitest'

import { RemoveEventoController } from '@/application/evento/RemoveEventoController'
import { RemoveEventoUseCase } from '@/domain/evento/RemoveEventoUseCase'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { NotFoundError } from '@/library/http/error/NotFoundError'

const headers = {} as Headers

function makeRequest(params: Record<string, unknown>): HttpRequest {
  return {
    body: {},
    headers,
    method: Method.Delete,
    params,
    path: '/v1/eventos/10'
  } satisfies HttpRequest
}

describe('RemoveEventoController', () => {
  test('retorna 204 quando o evento é removido', async () => {
    const removeEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(true))
    } as unknown as RemoveEventoUseCase

    const controller = new RemoveEventoController({ removeEventoUseCase })
    const response = await controller.handle(makeRequest({ eventoId: '10' }), vi.fn())

    expect(removeEventoUseCase.execute).toHaveBeenCalledWith({ id: 10 })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.NoContent)
  })

  test('retorna 404 quando o evento não existe', async () => {
    const removeEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(false))
    } as unknown as RemoveEventoUseCase

    const controller = new RemoveEventoController({ removeEventoUseCase })
    const response = await controller.handle(makeRequest({ eventoId: '999' }), vi.fn())

    expect(response).toBeInstanceOf(NotFoundError)
  })

  test('retorna 400 quando eventoId é inválido', async () => {
    const removeEventoUseCase = { execute: vi.fn() } as unknown as RemoveEventoUseCase
    const controller = new RemoveEventoController({ removeEventoUseCase })

    const response = await controller.handle(makeRequest({ eventoId: 'abc' }), vi.fn())

    expect(removeEventoUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 500 quando ocorre erro de infraestrutura', async () => {
    const removeEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('DB down')))
    } as unknown as RemoveEventoUseCase

    const controller = new RemoveEventoController({ removeEventoUseCase })
    const response = await controller.handle(makeRequest({ eventoId: '10' }), vi.fn())

    expect((response as Error).name).toBe('InternalServerError')
  })
})
