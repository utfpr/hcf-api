import { ListaEstadosUseCase } from '@/domain/estado/ListaEstadosUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaEstadosUseCase: ListaEstadosUseCase
}

export class ListaEstadosController implements RequestHandler {
  private readonly listaEstadosUseCase: ListaEstadosUseCase

  constructor(dependencies: Dependencies) {
    this.listaEstadosUseCase = dependencies.listaEstadosUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { paisSigla } = request.params as { paisSigla?: string }

    if (!paisSigla) {
      return new BadRequestError({ message: 'paisSigla é obrigatório' })
    }

    const result = await this.listaEstadosUseCase.execute({ paisSigla })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return { body: result.value, statusCode: StatusCode.Ok }
  }
}
