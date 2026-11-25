import { FamiliaCollection } from '@/domain/familia/FamiliaCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

import { familiaBody } from './familiaHttp'

interface Dependencies {
  familiaCollection: FamiliaCollection
}

export class ListaFamiliasController implements RequestHandler {
  private readonly familiaCollection: FamiliaCollection

  constructor(dependencies: Dependencies) {
    this.familiaCollection = dependencies.familiaCollection
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const {
      nome, familia, reino_id: reinoId, order
    } = request.params
    if (
      (nome !== undefined && typeof nome !== 'string')
      || (familia !== undefined && typeof familia !== 'string')
      || (reinoId !== undefined && typeof reinoId !== 'string')
      || (order !== undefined && typeof order !== 'string')
    ) {
      return new BadRequestError({ message: 'nome, familia, reino_id e order devem ser strings' })
    }

    if (reinoId !== undefined && !/^\d+$/.test(reinoId)) {
      return new BadRequestError({ message: 'reino_id inválido' })
    }

    const parsedOrder = parseOrder(order)
    if (parsedOrder instanceof Error) {
      return new BadRequestError({ message: parsedOrder.message })
    }

    const result = await this.familiaCollection.findAll({
      nome: nome ?? familia,
      reino_id: reinoId,
      order: parsedOrder
    })
    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Ok, body: result.value.map(familiaBody) }
  }
}

const ORDER_ERROR = 'order inválido. Use o formato "id:asc", "id:desc", "nome:asc", "nome:desc", "reino:asc" ou "reino:desc"'

function parseOrder(order?: string): { column: 'id' | 'nome' | 'reino'; direction: 'asc' | 'desc' } | Error | undefined {
  if (!order) return undefined

  const pieces = order.split(':')
  if (pieces.length !== 2) {
    return new Error(ORDER_ERROR)
  }

  const [rawColumn, rawDirection] = pieces
  const column = rawColumn.trim().toLowerCase()
  const direction = rawDirection.trim().toLowerCase()

  if (
    (column !== 'id' && column !== 'nome' && column !== 'reino')
    || (direction !== 'asc' && direction !== 'desc')
  ) {
    return new Error(ORDER_ERROR)
  }

  return { column, direction }
}
