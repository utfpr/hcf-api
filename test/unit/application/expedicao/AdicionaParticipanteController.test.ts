import {
  describe, expect, test, vi
} from 'vitest'

import { AdicionaParticipanteController } from '@/application/expedicao/AdicionaParticipanteController'
import { AdicionaParticipanteUseCase } from '@/domain/expedicao/AdcionaParticipanteUseCase'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'

const headers = {} as Headers

function makeRequest(params: Record<string, unknown>, body: unknown, user?: { id: number; tipo_usuario_id: number }): HttpRequest {
  return {
    body,
    headers,
    method: Method.Post,
    params,
    path: '/v2/expedicoes/1/participantes',
    user: user
      ? {
          ...user,
          email: 'test@hcf.com',
          nome: 'Test'
        }
      : undefined
  } satisfies HttpRequest
}

describe('AdicionaParticipanteController', () => {
  test('retorna 201 e repassa request.user.id para a UseCase', async () => {
    const adicionaParticipanteUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(undefined))
    } as unknown as AdicionaParticipanteUseCase

    const controller = new AdicionaParticipanteController({ adicionaParticipanteUseCase })
    const response = await controller.handle(
      makeRequest({ expedicaoId: '1' }, { usuarioId: 15 }, { id: 42, tipo_usuario_id: 1 }),
      vi.fn()
    )

    expect(adicionaParticipanteUseCase.execute).toHaveBeenCalledWith(1, 15, 42)
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Created)
  })

  test('retorna 400 quando usuarioId é inválido', async () => {
    const adicionaParticipanteUseCase = { execute: vi.fn() } as unknown as AdicionaParticipanteUseCase
    const controller = new AdicionaParticipanteController({ adicionaParticipanteUseCase })

    const response = await controller.handle(makeRequest({ expedicaoId: '1' }, { usuarioId: -1 }), vi.fn())

    expect(adicionaParticipanteUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })
})
