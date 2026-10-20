import {
  describe, expect, test, vi
} from 'vitest'

import { SubstituiRotasController } from '@/application/expedicao/SubstituiRotasController'
import { SubstituiRotasUseCase } from '@/domain/expedicao/SubstituiRotasUseCase'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'

const headers = {} as Headers

const rotas = [{ cidade_id: 1, locais_coleta_ids: [10, 20] }]

function makeRequest(params: Record<string, unknown>, body: unknown, user?: { id: number; tipo_usuario_id: number }): HttpRequest {
  return {
    body,
    headers,
    method: Method.Put,
    params,
    path: '/v2/expedicoes/1/rotas',
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
  test('retorna 204 e repassa request.user.id para a UseCase', async () => {
    const SubstituiRotasUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(undefined))
    } as unknown as SubstituiRotasUseCase

    const controller = new SubstituiRotasController({ SubstituiRotasUseCase })
    const response = await controller.handle(
      makeRequest({ expedicaoId: '1' }, { rotas }, { id: 42, tipo_usuario_id: 1 }),
      vi.fn()
    )

    expect(SubstituiRotasUseCase.execute).toHaveBeenCalledWith(1, rotas, 42)
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.NoContent)
  })

  test('retorna 400 quando expedicaoId é inválido', async () => {
    const SubstituiRotasUseCase = { execute: vi.fn() } as unknown as SubstituiRotasUseCase
    const controller = new SubstituiRotasController({ SubstituiRotasUseCase })

    const response = await controller.handle(makeRequest({ expedicaoId: 'invalido' }, { rotas }), vi.fn())

    expect(SubstituiRotasUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })
})
