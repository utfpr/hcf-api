import { ListaSolosUseCase } from '@/domain/solo/ListaSolosUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaSolosUseCase: ListaSolosUseCase
}

export class ListaSolosController implements RequestHandler {
  private readonly listaSolosUseCase: ListaSolosUseCase

  constructor(dependencies: Dependencies) {
    this.listaSolosUseCase = dependencies.listaSolosUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { nome, order } = request.params as {
      nome?: string
      order?: string
    }

    const result = await this.listaSolosUseCase.execute({
      nome,
      order: parseOrder(order)
    })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}

function parseOrder(order?: string): { column: 'id' | 'nome'; direction: 'asc' | 'desc' } | undefined {
  if (!order) return undefined

  const [column, direction] = order.split(':')
  const normalizedColumn = column === 'nome' || column === 'id' ? column : 'id'
  const normalizedDirection = direction === 'asc' || direction === 'desc' ? direction : 'desc'

  return {
    column: normalizedColumn,
    direction: normalizedDirection
  }
}
