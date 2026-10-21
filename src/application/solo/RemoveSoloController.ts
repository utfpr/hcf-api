import { SoloEmUsoError } from '@/domain/solo/error/SoloEmUsoError'
import { SoloNaoEncontradoError } from '@/domain/solo/error/SoloNaoEncontradoError'
import { RemoveSoloUseCase } from '@/domain/solo/RemoveSoloUseCase'
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
  removeSoloUseCase: RemoveSoloUseCase
}

export class RemoveSoloController implements RequestHandler {
  private readonly removeSoloUseCase: RemoveSoloUseCase

  constructor(dependencies: Dependencies) {
    this.removeSoloUseCase = dependencies.removeSoloUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { soloId } = request.params as { soloId?: string }

    if (soloId === undefined || soloId === null || soloId === '' || !/^\d+$/.test(soloId)) {
      return new BadRequestError({ message: 'soloId inválido' })
    }

    const result = await this.removeSoloUseCase.execute({ id: Number(soloId) })

    if (result.left()) {
      if (result.value instanceof SoloEmUsoError) {
        return new ConflictError({ message: result.value.message })
      }
      if (result.value instanceof SoloNaoEncontradoError) {
        return new NotFoundError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.NoContent, body: null }
  }
}
