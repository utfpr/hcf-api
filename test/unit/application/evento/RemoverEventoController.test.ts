import {
  describe, expect, test, vi
} from 'vitest'

import { RemoverEventoController } from '@/application/evento/RemoverEventoController'
import { RemoverEventoUseCase } from '@/domain/evento/RemoverEventoUseCase'
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
    path: '/v2/eventos/10'
  } satisfies HttpRequest
}

describe('RemoverEventoController', () => {
  test('retorna 204 quando o evento é removido', async () => {
    const removerEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(true))
    } as unknown as RemoverEventoUseCase

    const controller = new RemoverEventoController({ removerEventoUseCase })
    const response = await controller.handle(makeRequest({ eventoId: '10' }), vi.fn())

    expect(removerEventoUseCase.execute).toHaveBeenCalledWith({ id: 10 })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.NoContent)
  })

  test('retorna 404 quando o evento não existe', async () => {
    const removerEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(false))
    } as unknown as RemoverEventoUseCase

    const controller = new RemoverEventoController({ removerEventoUseCase })
    const response = await controller.handle(makeRequest({ eventoId: '999' }), vi.fn())

    expect(response).toBeInstanceOf(NotFoundError)
  })

  test('retorna 400 quando eventoId é inválido', async () => {
    const removerEventoUseCase = { execute: vi.fn() } as unknown as RemoverEventoUseCase
    const controller = new RemoverEventoController({ removerEventoUseCase })

    const response = await controller.handle(makeRequest({ eventoId: 'abc' }), vi.fn())

    expect(removerEventoUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 500 quando ocorre erro de infraestrutura', async () => {
    const removerEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('DB down')))
    } as unknown as RemoverEventoUseCase

    const controller = new RemoverEventoController({ removerEventoUseCase })
    const response = await controller.handle(makeRequest({ eventoId: '10' }), vi.fn())

    expect((response as Error).name).toBe('InternalServerError')
  })
})
