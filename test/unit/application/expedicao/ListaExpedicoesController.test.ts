import {
  describe, expect, test, vi
} from 'vitest'

import {
  CustomHttpRequest,
  ListaExpedicoesController
} from '@/application/expedicao/ListaExpedicoesController'
import {
  ExpedicaoFilters,
  ExpedicaoListItem,
  Paginated
} from '@/domain/expedicao/ExpedicaoCollection'
import { ListaExpedicoesUseCase } from '@/domain/expedicao/ListaExpedicoesUseCase'
import { Either } from '@/library/either/Either'
import {
  Headers, Method, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { InternalServerError } from '@/library/http/error/InternalServerError'

describe('ListaExpedicoesController', () => {
  const headers = {} as Headers

  test('returns 200 with body for "Próximas expedições" (data_fim_de and order=data_inicio:asc)', async () => {
    const paginatedResult: Paginated<ExpedicaoListItem> = {
      itens: [
        {
          id: 1,
          descricao: 'Próxima expedição',
          data_inicio: '2026-10-05',
          data_fim: '2026-10-15',
          cidade_id: 1,
          created_at: new Date('2026-10-01T00:00:00.000Z'),
          updated_at: new Date('2026-10-01T00:00:00.000Z'),
          created_by: null,
          updated_by: null,
          cidade_nome: 'Curitiba',
          estado_sigla: 'PR',
          participantes: [],
          rotas: []
        }
      ],
      total: 1,
      limite: 20,
      pagina: 1
    }

    const listaExpedicoesUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(paginatedResult))
    } as unknown as ListaExpedicoesUseCase

    const controller = new ListaExpedicoesController({ listaExpedicoesUseCase })

    const request: CustomHttpRequest = {
      body: {},
      headers,
      method: Method.Get,
      params: {
        data_fim_de: '2026-10-04',
        order: 'data_inicio:asc'
      },
      path: '/v2/expedicoes'
    }

    const response = await controller.handle(request, vi.fn())

    expect(listaExpedicoesUseCase.execute).toHaveBeenCalledWith<[ExpedicaoFilters]>({
      data_fim_de: '2026-10-04',
      order: {
        column: 'data_inicio',
        direction: 'asc'
      }
    })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Ok)
    expect('body' in response ? response.body : undefined).toEqual(paginatedResult)
  })

  test('returns 200 with body for "Expedições realizadas" (data_fim_ate and order=data_fim:desc)', async () => {
    const paginatedResult: Paginated<ExpedicaoListItem> = {
      itens: [
        {
          id: 2,
          descricao: 'Expedição realizada',
          data_inicio: '2026-09-01',
          data_fim: '2026-09-10',
          cidade_id: 1,
          created_at: new Date('2026-09-01T00:00:00.000Z'),
          updated_at: new Date('2026-09-01T00:00:00.000Z'),
          created_by: null,
          updated_by: null,
          cidade_nome: 'Curitiba',
          estado_sigla: 'PR',
          participantes: [],
          rotas: []
        }
      ],
      total: 1,
      limite: 20,
      pagina: 1
    }

    const listaExpedicoesUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(paginatedResult))
    } as unknown as ListaExpedicoesUseCase

    const controller = new ListaExpedicoesController({ listaExpedicoesUseCase })

    const request: CustomHttpRequest = {
      body: {},
      headers,
      method: Method.Get,
      params: {
        data_fim_ate: '2026-10-03',
        order: 'data_fim:desc'
      },
      path: '/v2/expedicoes'
    }

    const response = await controller.handle(request, vi.fn())

    expect(listaExpedicoesUseCase.execute).toHaveBeenCalledWith<[ExpedicaoFilters]>({
      data_fim_ate: '2026-10-03',
      order: {
        column: 'data_fim',
        direction: 'desc'
      }
    })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Ok)
    expect('body' in response ? response.body : undefined).toEqual(paginatedResult)
  })

  test('forwards all query parameters correctly', async () => {
    const emptyResult: Paginated<ExpedicaoListItem> = {
      itens: [],
      total: 0,
      limite: 10,
      pagina: 2
    }
    const listaExpedicoesUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(emptyResult))
    } as unknown as ListaExpedicoesUseCase

    const controller = new ListaExpedicoesController({ listaExpedicoesUseCase })

    const request: CustomHttpRequest = {
      body: {},
      headers,
      method: Method.Get,
      params: {
        cidade_id: '123',
        usuario_id: '456',
        data_inicio_de: '2026-01-01',
        data_inicio_ate: '2026-02-01',
        data_fim_de: '2026-03-01',
        data_fim_ate: '2026-04-01',
        order: 'id:asc',
        limite: '10',
        pagina: '2'
      },
      path: '/v2/expedicoes'
    }

    const response = await controller.handle(request, vi.fn())

    expect(listaExpedicoesUseCase.execute).toHaveBeenCalledWith<[ExpedicaoFilters]>({
      cidade_id: 123,
      usuario_id: 456,
      data_inicio_de: '2026-01-01',
      data_inicio_ate: '2026-02-01',
      data_fim_de: '2026-03-01',
      data_fim_ate: '2026-04-01',
      order: {
        column: 'id',
        direction: 'asc'
      },
      limite: 10,
      pagina: 2
    })
    expect('statusCode' in response ? response.statusCode : undefined).toBe(StatusCode.Ok)
  })

  test('returns BadRequestError when order format or column is invalid', async () => {
    const listaExpedicoesUseCase = {
      execute: vi.fn()
    } as unknown as ListaExpedicoesUseCase

    const controller = new ListaExpedicoesController({ listaExpedicoesUseCase })

    const request: CustomHttpRequest = {
      body: {},
      headers,
      method: Method.Get,
      params: { order: 'invalido' },
      path: '/v2/expedicoes'
    }

    const response = await controller.handle(request, vi.fn())

    expect(listaExpedicoesUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(BadRequestError)
  })

  test('returns InternalServerError when use case returns Either.left', async () => {
    const listaExpedicoesUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new Error('DB failure')))
    } as unknown as ListaExpedicoesUseCase

    const controller = new ListaExpedicoesController({ listaExpedicoesUseCase })

    const request: CustomHttpRequest = {
      body: {},
      headers,
      method: Method.Get,
      params: {},
      path: '/v2/expedicoes'
    }

    const response = await controller.handle(request, vi.fn())

    expect(response).toBeInstanceOf(InternalServerError)
    expect((response as InternalServerError).message).toBe('DB failure')
  })

  test('returns InternalServerError when unexpected exception occurs', async () => {
    const listaExpedicoesUseCase = {
      execute: vi.fn().mockRejectedValue(new Error('Crash'))
    } as unknown as ListaExpedicoesUseCase

    const controller = new ListaExpedicoesController({ listaExpedicoesUseCase })

    const request: CustomHttpRequest = {
      body: {},
      headers,
      method: Method.Get,
      params: {},
      path: '/v2/expedicoes'
    }

    const response = await controller.handle(request, vi.fn())

    expect(response).toBeInstanceOf(InternalServerError)
    expect((response as InternalServerError).message).toBe('Crash')
  })
})
