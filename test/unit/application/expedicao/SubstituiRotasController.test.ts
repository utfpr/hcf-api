import {
  describe, expect, test, vi
} from 'vitest'

import { SubstituiRotasController } from '@/application/expedicao/SubstituiRotasController'
import { ExpedicaoNaoEncontradaError } from '@/domain/expedicao/error/ExpedicaoNaoEncontradaError'
import { ExpedicaoCollection } from '@/domain/expedicao/ExpedicaoCollection'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { NotFoundError } from '@/library/http/error/NotFoundError'

const headers = {} as Headers

const rotas = [{ cidade_id: 1, locais_coleta_ids: [10, 20] }]

function makeRequest(params: Record<string, unknown>, body: unknown, user?: { id: number; tipo_usuario_id: number }): HttpRequest {
  return {
    body,
    headers,
    method: Method.Put,
    params,
    path: '/v1/expedicoes/1/rotas',
    user: user
      ? {
          ...user,
          email: 'test@hcf.com',
          nome: 'Test'
        }
      : undefined
  } satisfies HttpRequest
}

describe('SubstituiRotasController', () => {
  test('retorna 204 e repassa request.user.id para a collection', async () => {
    const expedicaoCollection = {
      substituteRoute: vi.fn().mockResolvedValue(Either.right(undefined))
    } as unknown as ExpedicaoCollection

    const controller = new SubstituiRotasController({ expedicaoCollection })
    const response = await controller.handle(
      makeRequest({ expedicaoId: '1' }, { rotas }, { id: 42, tipo_usuario_id: 1 }),
      vi.fn()
    )

    expect(expedicaoCollection.substituteRoute).toHaveBeenCalledWith(1, rotas, 42)
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.NoContent)
  })

  test('retorna 404 quando a expedição não existe', async () => {
    const expedicaoCollection = {
      substituteRoute: vi.fn().mockResolvedValue(Either.left(new ExpedicaoNaoEncontradaError()))
    } as unknown as ExpedicaoCollection

    const controller = new SubstituiRotasController({ expedicaoCollection })
    const response = await controller.handle(makeRequest({ expedicaoId: '1' }, { rotas }), vi.fn())

    expect(response).toBeInstanceOf(NotFoundError)
  })

  test('retorna 400 quando expedicaoId é inválido', async () => {
    const expedicaoCollection = { substituteRoute: vi.fn() } as unknown as ExpedicaoCollection
    const controller = new SubstituiRotasController({ expedicaoCollection })

    const response = await controller.handle(makeRequest({ expedicaoId: 'invalido' }, { rotas }), vi.fn())

    expect(expedicaoCollection.substituteRoute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })
})
