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
      if (result.value.message === 'Fase sucessional está em uso e não pode ser removida') {
        return new ConflictError({ message: 'Fase sucessional está em uso e não pode ser removida' })
      }
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Fase sucessional não encontrada' })
    }

    return { statusCode: StatusCode.NoContent, body: undefined }
  }
}
