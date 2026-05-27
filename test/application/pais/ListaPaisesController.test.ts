import {
  describe, expect, test, vi
} from 'vitest'

import { ListaPaisesController } from '@/application/pais/ListaPaisesController'
import { ListaPaisesUseCase } from '@/domain/pais/ListaPaisesUseCase'
import { Either } from '@/library/either/Either'
import { Method, StatusCode } from '@/library/http/common'
import type { Headers } from '@/library/http/common'
import type { HttpRequest } from '@/library/http/common'
import type { InternalServerError } from '@/library/http/error/InternalServerError'

describe('ListaPaisesController', () => {
  const headers = {} as Headers

  test('returns 200 with body when use case succeeds', async () => {
    const lista = [
      {
        id: 1, nome: 'Brasil', sigla: 'BRA' as string | null
      }
    ]

    const listaPaisesUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(lista))
    } as unknown as ListaPaisesUseCase

    const controller = new ListaPaisesController({ listaPaisesUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get as Method,
      params: { nome: 'Bra' },
      path: '/paises'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect(listaPaisesUseCase.execute).toHaveBeenCalledWith({ nome: 'Bra' })
    expect('statusCode' in response && response.statusCode).toBe(StatusCode.Ok)

    expect('body' in response ? response.body : undefined).toEqual(lista)
  })

  test('returns InternalServerError when use case fails', async () => {
    const listaPaisesUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('boom')))
    } as unknown as ListaPaisesUseCase

    const controller = new ListaPaisesController({ listaPaisesUseCase })

    const request = {
      body: {},
      headers,
      method: Method.Get as Method,
      params: {},
      path: '/paises'
    } satisfies HttpRequest

    const response = await controller.handle(request, vi.fn())

    expect((response as InternalServerError).name).toBe('InternalServerError')
  })
})
