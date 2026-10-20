import { BuscaEventoPorIdUseCase } from '@/domain/evento/BuscaEventoPorIdUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  buscaEventoPorIdUseCase: BuscaEventoPorIdUseCase
}

export class BuscaEventoController implements RequestHandler {
  private readonly buscaEventoPorIdUseCase: BuscaEventoPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.buscaEventoPorIdUseCase = dependencies.buscaEventoPorIdUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { eventoId } = request.params as { eventoId?: string }

    if (
      eventoId === undefined
      || eventoId === null
      || eventoId === ''
      || !/^\d+$/.test(eventoId)
    ) {
      return new BadRequestError({ message: 'eventoId inválido' })
    }

    const result = await this.buscaEventoPorIdUseCase.execute({
      id: Number(eventoId)
    })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Evento não encontrado' })
    }

    return {
      statusCode: StatusCode.Ok,
      body: result.value
    }
  }
}
