import { ListaEventosUseCase } from '@/domain/evento/ListaEventosUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaEventosUseCase: ListaEventosUseCase
}

export class ListaEventosController implements RequestHandler {
  private readonly listaEventosUseCase: ListaEventosUseCase

  constructor(dependencies: Dependencies) {
    this.listaEventosUseCase = dependencies.listaEventosUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { expedicaoId } = request.params as { expedicaoId?: string }

    if (
      expedicaoId === undefined
      || expedicaoId === null
      || expedicaoId === ''
      || !/^\d+$/.test(expedicaoId)
    ) {
      return new BadRequestError({ message: 'expedicaoId inválido' })
    }

    const result = await this.listaEventosUseCase.execute({
      expedicao_id: Number(expedicaoId)
    })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return {
      statusCode: StatusCode.Ok,
      body: result.value
    }
  }
}
