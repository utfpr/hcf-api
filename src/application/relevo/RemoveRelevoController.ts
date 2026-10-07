import { RelevoEmUsoError } from '@/domain/relevo/error/RelevoEmUsoError'
import { RelevoNaoEncontradoError } from '@/domain/relevo/error/RelevoNaoEncontradoError'
import { RemoveRelevoUseCase } from '@/domain/relevo/RemoveRelevoUseCase'
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
  removeRelevoUseCase: RemoveRelevoUseCase
}

export class RemoveRelevoController implements RequestHandler {
  private readonly removeRelevoUseCase: RemoveRelevoUseCase

  constructor(dependencies: Dependencies) {
    this.removeRelevoUseCase = dependencies.removeRelevoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { relevoId } = request.params as { relevoId?: string }

    if (relevoId === undefined || relevoId === null || relevoId === '' || !/^\d+$/.test(relevoId)) {
      return new BadRequestError({ message: 'relevoId inválido' })
    }

    const existing = await this.removeRelevoUseCase.execute({ id: Number(relevoId) })

    if (existing.left()) {
      if (existing.value instanceof RelevoEmUsoError) {
        return new ConflictError({ message: existing.value.message })
      }
      if (existing.value instanceof RelevoNaoEncontradoError) {
        return new NotFoundError({ message: existing.value.message })
      }
      return new InternalServerError({ message: existing.value.message })
    }

    return { statusCode: StatusCode.NoContent }
  }
}
