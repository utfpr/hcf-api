import {
  describe, expect, test, vi
} from 'vitest'

import { CriaLembreteController } from '@/application/lembrete/CriaLembreteController'
import { CriaLembreteUseCase } from '@/domain/lembrete/CriaLembreteUseCase'
import { CollectionError } from '@/infrastructure/error/CollectionError'
import { ForeignKeyViolationError } from '@/infrastructure/error/ForeignKeyViolationError'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'

const headers = {} as Headers

const validBody = {
  data_coleta: '2026-11-20',
  familia: 'Velloziaceae',
  local_coleta: 'Serra do Cipó'
}

function makeRequest(body: unknown): HttpRequest {
  return {
    body, headers, method: Method.Post, params: {}, path: '/v2/lembretes'
  } satisfies HttpRequest
}

describe('CriaLembreteController', () => {
  test('retorna 201 e preenche com null os campos da ficha ausentes', async () => {
    const criado = { id: 1, ...validBody }
    const criaLembreteUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(criado))
    } as unknown as CriaLembreteUseCase

    const controller = new CriaLembreteController({ criaLembreteUseCase })
    const response = await controller.handle(makeRequest(validBody), vi.fn())

    expect(criaLembreteUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({
      data_coleta: '2026-11-20',
      familia: 'Velloziaceae',
      local_coleta: 'Serra do Cipó',
      nome_cientifico: null
    }))
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Created)
    expect('body' in response ? response.body : undefined).toEqual(criado)
  })

  test('retorna 400 quando local_coleta está ausente', async () => {
    const criaLembreteUseCase = { execute: vi.fn() } as unknown as CriaLembreteUseCase
    const controller = new CriaLembreteController({ criaLembreteUseCase })

    const response = await controller.handle(makeRequest({ data_coleta: '2026-11-20' }), vi.fn())

    expect(criaLembreteUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 400 quando um campo da ficha não é string', async () => {
    const criaLembreteUseCase = { execute: vi.fn() } as unknown as CriaLembreteUseCase
    const controller = new CriaLembreteController({ criaLembreteUseCase })

    const response = await controller.handle(makeRequest({ ...validBody, solo: 42 }), vi.fn())

    expect(criaLembreteUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 400 quando a validação de domínio falha', async () => {
    const criaLembreteUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('Data de coleta inválida')))
    } as unknown as CriaLembreteUseCase

    const controller = new CriaLembreteController({ criaLembreteUseCase })
    const response = await controller.handle(makeRequest(validBody), vi.fn())

    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 500 quando a collection falha', async () => {
    const criaLembreteUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new CollectionError({ message: 'Failed to create lembrete' })))
    } as unknown as CriaLembreteUseCase

    const controller = new CriaLembreteController({ criaLembreteUseCase })
    const response = await controller.handle(makeRequest(validBody), vi.fn())

    expect(response).toBeInstanceOf(InternalServerError)
  })

  test('repassa a expedição de origem e usa null quando ela não vem', async () => {
    const criaLembreteUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right({ id: 1, ...validBody }))
    } as unknown as CriaLembreteUseCase
    const controller = new CriaLembreteController({ criaLembreteUseCase })

    await controller.handle(makeRequest({ ...validBody, expedicao_id: 3 }), vi.fn())
    await controller.handle(makeRequest(validBody), vi.fn())

    expect(criaLembreteUseCase.execute).toHaveBeenNthCalledWith(1, expect.objectContaining({ expedicao_id: 3 }))
    expect(criaLembreteUseCase.execute).toHaveBeenNthCalledWith(2, expect.objectContaining({ expedicao_id: null }))
  })

  test('retorna 400 quando expedicao_id não é um id válido', async () => {
    const criaLembreteUseCase = { execute: vi.fn() } as unknown as CriaLembreteUseCase
    const controller = new CriaLembreteController({ criaLembreteUseCase })

    for (const expedicaoId of ['abc', 0, -1, 1.5, {}]) {
      const response = await controller.handle(makeRequest({ ...validBody, expedicao_id: expedicaoId }), vi.fn())
      expect(response).toBeInstanceOf(BadRequestError)
    }
    expect(criaLembreteUseCase.execute).not.toHaveBeenCalled()
  })

  test('retorna 404 quando a expedição não existe', async () => {
    const criaLembreteUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new ForeignKeyViolationError({ message: 'Expedição não encontrada' })))
    } as unknown as CriaLembreteUseCase

    const controller = new CriaLembreteController({ criaLembreteUseCase })
    const response = await controller.handle(makeRequest({ ...validBody, expedicao_id: 999 }), vi.fn())

    expect(response).toBeInstanceOf(NotFoundError)
  })
})
