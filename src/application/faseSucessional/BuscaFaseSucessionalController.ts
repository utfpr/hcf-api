import { FaseSucessionalCollection } from '@/domain/faseSucessional/FaseSucessionalCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

import { faseSucessionalBody } from './faseSucessionalHttp'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

export class BuscaFaseSucessionalController implements RequestHandler {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { faseSucessionalId } = request.params as { faseSucessionalId?: string }

    if (faseSucessionalId === undefined || faseSucessionalId === null || faseSucessionalId === '' || !/^\d+$/.test(faseSucessionalId)) {
      return new BadRequestError({ message: 'faseSucessionalId inválido' })
    }

    const result = await this.faseSucessionalCollection.findById(faseSucessionalId)

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Fase sucessional não encontrada' })
    }

    const body = faseSucessionalBody(result.value)
    if (!body) {
      return new InternalServerError({ message: 'Erro ao buscar fase sucessional' })
    }

    return { statusCode: StatusCode.Ok, body }
  }
}
