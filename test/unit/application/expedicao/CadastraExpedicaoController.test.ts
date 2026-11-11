import {
  describe, expect, test, vi
} from 'vitest'

import { CadastraExpedicaoController } from '@/application/expedicao/CadastraExpedicaoController'
import { CadastraExpedicaoUseCase } from '@/domain/expedicao/CadastraExpedicaoUseCase'
import { Attributes } from '@/domain/expedicao/Expedicao'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'

const headers = {} as Headers

const expedicaoCriada: Attributes = {
  id: 1,
  descricao: 'Expedição Teste',
  data_inicio: '2026-11-01',
  data_fim: '2026-11-10',
  cidade_id: 10,
  created_at: new Date(),
  updated_at: new Date(),
  created_by: 42,
  updated_by: 42
}

const validBody = {
  descricao: 'Expedição Teste',
  data_inicio: '2026-11-01',
  data_fim: '2026-11-10',
  cidade_id: 10,
  participantes: [1, 2],
  rotas: [{ cidade_id: 10, locais_coleta_ids: [100] }]
}

function makeRequest(body: unknown, user?: { id: number; tipo_usuario_id: number }): HttpRequest {
  return {
    body,
    headers,
    method: Method.Post,
    params: {},
    path: '/v1/expedicoes',
    user: user
      ? {
          ...user,
          email: 'test@hcf.com',
          nome: 'Test'
        }
      : undefined
  } satisfies HttpRequest
}

describe('CadastraExpedicaoController', () => {
  test('retorna 201 e usa request.user.id no created_by', async () => {
    const cadastraExpedicaoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(expedicaoCriada))
    } as unknown as CadastraExpedicaoUseCase

    const controller = new CadastraExpedicaoController({ cadastraExpedicaoUseCase })
    const response = await controller.handle(makeRequest(validBody, { id: 42, tipo_usuario_id: 1 }), vi.fn())

    expect(cadastraExpedicaoUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({
      created_by: 42,
      cidade_id: 10,
      data_inicio: '2026-11-01',
      data_fim: '2026-11-10'
    }))
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Created)
    expect('body' in response ? response.body : undefined).toEqual(expedicaoCriada)
  })

  test('atribui null a created_by se request.user não estiver presente', async () => {
    const cadastraExpedicaoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right({ ...expedicaoCriada, created_by: null }))
    } as unknown as CadastraExpedicaoUseCase

    const controller = new CadastraExpedicaoController({ cadastraExpedicaoUseCase })
    await controller.handle(makeRequest(validBody), vi.fn())

    expect(cadastraExpedicaoUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({
      created_by: null
    }))
  })

  test('retorna 400 quando datas são inválidas', async () => {
    const cadastraExpedicaoUseCase = { execute: vi.fn() } as unknown as CadastraExpedicaoUseCase
    const controller = new CadastraExpedicaoController({ cadastraExpedicaoUseCase })

    const response = await controller.handle(makeRequest({ ...validBody, data_inicio: 'invalida' }), vi.fn())

    expect(cadastraExpedicaoUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })
})
