import { LocalColetaEmUsoError } from '@/domain/localColeta/error/LocalColetaEmUsoError'
import { LocalColetaNaoEncontradaError } from '@/domain/localColeta/error/LocalColetaNaoEncontradaError'
import { RemoveLocalColetaUseCase } from '@/domain/localColeta/RemoveLocalColetaUseCase'
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
  removeLocalColetaUseCase: RemoveLocalColetaUseCase
}

export class RemoveLocalColetaController implements RequestHandler {
  private readonly removeLocalColetaUseCase: RemoveLocalColetaUseCase

  constructor(dependencies: Dependencies) {
    this.removeLocalColetaUseCase = dependencies.removeLocalColetaUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { localColetaId } = request.params as { localColetaId?: string }
    if (localColetaId === undefined || localColetaId === null || localColetaId === '' || !/^\d+$/.test(localColetaId)) {
      return new BadRequestError({ message: 'localColetaId inválido' })
    }

    const result = await this.removeLocalColetaUseCase.execute(localColetaId)
    if (result.left()) {
      if (result.value instanceof LocalColetaEmUsoError) {
        return new ConflictError({ message: result.value.message })
      }
      if (result.value instanceof LocalColetaNaoEncontradaError) {
        return new NotFoundError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.NoContent }
  }
}
