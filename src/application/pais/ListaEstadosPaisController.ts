import { ListaEstadosPaisUseCase } from '@/domain/pais/ListaEstadosPaisUseCase'
import { HttpRequest, HttpResponse, StatusCode } from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaEstadosPaisUseCase: ListaEstadosPaisUseCase
}

export class ListaEstadosPaisController implements RequestHandler {
  private readonly listaEstadosPaisUseCase: ListaEstadosPaisUseCase

  constructor(dependencies: Dependencies) {
    this.listaEstadosPaisUseCase = dependencies.listaEstadosPaisUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { pais_sigla: paisSigla } = request.params as { pais_sigla?: string }

    if (!paisSigla) {
      return new BadRequestError({ message: 'pais_sigla é obrigatório' })
    }

    const result = await this.listaEstadosPaisUseCase.execute({ sigla: paisSigla })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
