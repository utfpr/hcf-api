import { ListaFasesSucessionaisUseCase } from '@/domain/faseSucessional/ListaFasesSucessionaisUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaFasesSucessionaisUseCase: ListaFasesSucessionaisUseCase
}

export class ListaFasesSucessionaisController implements RequestHandler {
  private readonly listaFasesSucessionaisUseCase: ListaFasesSucessionaisUseCase

  constructor(dependencies: Dependencies) {
    this.listaFasesSucessionaisUseCase = dependencies.listaFasesSucessionaisUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { nome, order } = request.params as {
      nome?: string
      order?: string
    }

    const parsedOrder = parseOrder(order)
    if (parsedOrder instanceof Error) {
      return new BadRequestError({ message: parsedOrder.message })
    }

    const result = await this.listaFasesSucessionaisUseCase.execute({
      nome,
      order: parsedOrder
    })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}

function parseOrder(order?: string): { column: 'id' | 'nome'; direction: 'asc' | 'desc' } | Error | undefined {
  if (!order) return undefined

  const pieces = order.split(':')
  if (pieces.length !== 2) {
    return new Error('order inválido. Use o formato "id:asc", "id:desc", "nome:asc" ou "nome:desc"')
  }

  const [rawColumn, rawDirection] = pieces
  const column = rawColumn.trim().toLowerCase()
  const direction = rawDirection.trim().toLowerCase()

  if ((column !== 'id' && column !== 'nome') || (direction !== 'asc' && direction !== 'desc')) {
    return new Error('order inválido. Use o formato "id:asc", "id:desc", "nome:asc" ou "nome:desc"')
  }

  return {
    column,
    direction
  }
}
