import { FaseSucessionalEmUsoError } from '@/domain/faseSucessional/error/FaseSucessionalEmUsoError'
import { FaseSucessionalNaoEncontradoError } from '@/domain/faseSucessional/error/FaseSucessionalNaoEncontradoError'
import { RemoveFaseSucessionalUseCase } from '@/domain/faseSucessional/RemoveFaseSucessionalUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  removeFaseSucessionalUseCase: RemoveFaseSucessionalUseCase
}

export class RemoveFaseSucessionalController implements RequestHandler {
  private readonly removeFaseSucessionalUseCase: RemoveFaseSucessionalUseCase

  constructor(dependencies: Dependencies) {
    this.removeFaseSucessionalUseCase = dependencies.removeFaseSucessionalUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { faseSucessionalId } = request.params as { faseSucessionalId?: string }

    if (
      faseSucessionalId === undefined
      || faseSucessionalId === null
      || faseSucessionalId === ''
      || Number.isNaN(Number(faseSucessionalId))
      || Number(faseSucessionalId) <= 0
    ) {
      return new BadRequestError({ message: 'faseSucessionalId inválido' })
    }

    const result = await this.removeFaseSucessionalUseCase.execute({ id: Number(faseSucessionalId) })

    if (result.left()) {
      if (result.value instanceof FaseSucessionalEmUsoError) {
        return new ConflictError({ message: result.value.message })
      }

      if (result.value instanceof FaseSucessionalNaoEncontradoError) {
        return new NotFoundError({ message: result.value.message })
      }

      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.NoContent, body: undefined }
  }
}
