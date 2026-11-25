import { FamiliaCollection } from '@/domain/familia/FamiliaCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

import { familiaBody } from './familiaHttp'

interface Dependencies {
  familiaCollection: FamiliaCollection
}

export class BuscaFamiliaController implements RequestHandler {
  private readonly familiaCollection: FamiliaCollection

  constructor(dependencies: Dependencies) {
    this.familiaCollection = dependencies.familiaCollection
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { familiaId } = request.params as { familiaId?: string }
    if (familiaId === undefined || familiaId === null || familiaId === '' || !/^\d+$/.test(familiaId)) {
      return new BadRequestError({ message: 'familiaId inválido' })
    }

    const result = await this.familiaCollection.findById(familiaId)
    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Família não encontrada' })
    }

    return { statusCode: StatusCode.Ok, body: familiaBody(result.value) }
  }
}
