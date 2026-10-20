import {
  describe, expect, test, vi
} from 'vitest'

import { CriaEventoController } from '@/application/evento/CriaEventoController'
import { CriaEventoUseCase } from '@/domain/evento/CriaEventoUseCase'
import { Attributes } from '@/domain/evento/Evento'
import { CheckViolationError } from '@/infrastructure/error/CheckViolationError'
import { CollectionError } from '@/infrastructure/error/CollectionError'
import { ForeignKeyViolationError } from '@/infrastructure/error/ForeignKeyViolationError'
import { Either } from '@/library/either/Either'
import {
  Headers, HttpRequest, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { UnprocessableEntityError } from '@/library/http/error/UnprocessableEntityError'

const headers = {} as Headers

const attributes: Attributes = {
  altitude: null,
  data_captura: new Date('2026-02-15T14:32:00Z'),
  coleta: null,
  created_at: new Date(),
  created_by: null,
  expedicao_id: 1,
  id: 10,
  latitude: -20.2508,
  longitude: -46.4167,
  observacoes: 'Solo arenoso',
  tipo: 'DIARIO',
  updated_at: new Date(),
  updated_by: null
}

const validBody = {
  data_captura: '2026-02-15T14:32:00Z',
  latitude: -20.2508,
  longitude: -46.4167,
  observacoes: 'Solo arenoso',
  tipo: 'DIARIO'
}

function makeRequest(params: Record<string, unknown>, body: unknown): HttpRequest {
  return {
    body, headers, method: Method.Post, params, path: '/v1/expedicoes/1/eventos'
  } satisfies HttpRequest
}

describe('CriaEventoController', () => {
  test('retorna 201 com o evento criado', async () => {
    const criaEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(attributes))
    } as unknown as CriaEventoUseCase

    const controller = new CriaEventoController({ criaEventoUseCase })
    const response = await controller.handle(makeRequest({ expedicaoId: '1' }, validBody), vi.fn())

    expect(criaEventoUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({
      expedicao_id: 1, tipo: 'DIARIO'
    }))
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Created)
    expect('body' in response ? response.body : undefined).toEqual(attributes)
  })

  test('retorna 400 quando expedicaoId é inválido', async () => {
    const criaEventoUseCase = { execute: vi.fn() } as unknown as CriaEventoUseCase
    const controller = new CriaEventoController({ criaEventoUseCase })

    const response = await controller.handle(makeRequest({ expedicaoId: 'abc' }, validBody), vi.fn())

    expect(criaEventoUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 400 quando tipo é inválido', async () => {
    const criaEventoUseCase = { execute: vi.fn() } as unknown as CriaEventoUseCase
    const controller = new CriaEventoController({ criaEventoUseCase })

    const response = await controller.handle(
      makeRequest({ expedicaoId: '1' }, { ...validBody, tipo: 'FOTO' }),
      vi.fn()
    )

    expect(criaEventoUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 400 quando a validação de domínio falha (Either.left com Error simples)', async () => {
    const criaEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('Evento de coleta exige a ficha de coleta')))
    } as unknown as CriaEventoUseCase

    const controller = new CriaEventoController({ criaEventoUseCase })
    const response = await controller.handle(makeRequest({ expedicaoId: '1' }, validBody), vi.fn())

    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('retorna 404 quando a expedição não existe (ForeignKeyViolationError)', async () => {
    const criaEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new ForeignKeyViolationError({ message: 'Expedição não encontrada' })))
    } as unknown as CriaEventoUseCase

    const controller = new CriaEventoController({ criaEventoUseCase })
    const response = await controller.handle(makeRequest({ expedicaoId: '999' }, validBody), vi.fn())

    expect(response).toBeInstanceOf(NotFoundError)
  })

  test('retorna 422 quando o banco rejeita o tipo (CheckViolationError)', async () => {
    const criaEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new CheckViolationError({ message: 'tipo inválido' })))
    } as unknown as CriaEventoUseCase

    const controller = new CriaEventoController({ criaEventoUseCase })
    const response = await controller.handle(makeRequest({ expedicaoId: '1' }, validBody), vi.fn())

    expect(response).toBeInstanceOf(UnprocessableEntityError)
  })

  test('retorna 500 quando ocorre erro de infraestrutura genérico', async () => {
    const criaEventoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new CollectionError({ message: 'DB down' })))
    } as unknown as CriaEventoUseCase

    const controller = new CriaEventoController({ criaEventoUseCase })
    const response = await controller.handle(makeRequest({ expedicaoId: '1' }, validBody), vi.fn())

    expect((response as Error).name).toBe('InternalServerError')
  })
})
