import {
  describe, expect, test, vi
} from 'vitest'

import { AtualizaExpedicaoController } from '@/application/expedicao/AtualizaExpedicaoController'
import { AtualizaExpedicaoUseCase } from '@/domain/expedicao/AtualizaExpedicaoUseCase'
import { Attributes } from '@/domain/expedicao/Expedicao'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'

const headers = {} as Headers

const expedicaoAtualizada: Attributes = {
  id: 1,
  descricao: 'Expedição Atualizada',
  data_inicio: '2026-11-02',
  data_fim: '2026-11-12',
  cidade_id: 10,
  created_at: new Date(),
  updated_at: new Date(),
  created_by: 1,
  updated_by: 42
}

const validBody = {
  descricao: 'Expedição Atualizada',
  data_inicio: '2026-11-02',
  data_fim: '2026-11-12',
  cidade_id: 10
}

function makeRequest(params: Record<string, unknown>, body: unknown, user?: { id: number; tipo_usuario_id: number }): HttpRequest {
  return {
    body,
    headers,
    method: Method.Put,
    params,
    path: '/v1/expedicoes/1',
    user: user
      ? {
          ...user,
          email: 'test@hcf.com',
          nome: 'Test'
        }
      : undefined
  } satisfies HttpRequest
}

describe('AtualizaExpedicaoController', () => {
  test('retorna 200 e usa request.user.id no updated_by', async () => {
    const atualizaExpedicaoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(expedicaoAtualizada))
    } as unknown as AtualizaExpedicaoUseCase

    const controller = new AtualizaExpedicaoController({ atualizaExpedicaoUseCase })
    const response = await controller.handle(makeRequest({ expedicaoId: '1' }, validBody, { id: 42, tipo_usuario_id: 1 }), vi.fn())

    expect(atualizaExpedicaoUseCase.execute).toHaveBeenCalledWith(1, expect.objectContaining({
      updated_by: 42,
      cidade_id: 10,
      data_inicio: '2026-11-02',
      data_fim: '2026-11-12'
    }))
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Ok)
    expect('body' in response ? response.body : undefined).toEqual(expedicaoAtualizada)
  })

  test('retorna 400 quando expedicaoId é inválido', async () => {
    const atualizaExpedicaoUseCase = { execute: vi.fn() } as unknown as AtualizaExpedicaoUseCase
    const controller = new AtualizaExpedicaoController({ atualizaExpedicaoUseCase })

    const response = await controller.handle(makeRequest({ expedicaoId: 'abc' }, validBody), vi.fn())

    expect(atualizaExpedicaoUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })
})
