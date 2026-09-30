import { BuscaFaseSucessionalUseCase } from '@/domain/faseSucessional/BuscaFaseSucessionalUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  buscaFaseSucessionalUseCase: BuscaFaseSucessionalUseCase
}

export class BuscaFaseSucessionalController implements RequestHandler {
  private readonly buscaFaseSucessionalUseCase: BuscaFaseSucessionalUseCase

  constructor(dependencies: Dependencies) {
    this.buscaFaseSucessionalUseCase = dependencies.buscaFaseSucessionalUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { faseSucessionalId } = request.params as { faseSucessionalId?: string }

    if (!faseSucessionalId || Number.isNaN(Number(faseSucessionalId)) || Number(faseSucessionalId) <= 0) {
      return new BadRequestError({ message: 'faseSucessionalId inválido' })
    }

    const id = Number(faseSucessionalId)
    const result = await this.buscaFaseSucessionalUseCase.execute({ id })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Fase sucessional não encontrada' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
