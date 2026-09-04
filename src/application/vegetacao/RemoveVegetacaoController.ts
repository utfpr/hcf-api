import { RemoveVegetacaoUseCase } from '@/domain/vegetacao/RemoveVegetacaoUseCase'
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
  removeVegetacaoUseCase: RemoveVegetacaoUseCase
}

export class RemoveVegetacaoController implements RequestHandler {
  private readonly removeVegetacaoUseCase: RemoveVegetacaoUseCase

  constructor(dependencies: Dependencies) {
    this.removeVegetacaoUseCase = dependencies.removeVegetacaoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { vegetacaoId } = request.params as { vegetacaoId?: string }

    if (
      vegetacaoId === undefined
      || vegetacaoId === null
      || vegetacaoId === ''
      || Number.isNaN(Number(vegetacaoId))
      || Number(vegetacaoId) <= 0
    ) {
      return new BadRequestError({ message: 'vegetacaoId inválido' })
    }

    const result = await this.removeVegetacaoUseCase.execute({ id: Number(vegetacaoId) })

    if (result.left()) {
      const message = result.value.message.toLowerCase()
      if (message.includes('foreign') || message.includes('integrity') || message.includes('constraint') || message.includes('in use') || message.includes('referenc')) {
        return new ConflictError({ message: 'Vegetação está em uso e não pode ser removida' })
      }
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Vegetação não encontrada' })
    }

    return { statusCode: StatusCode.NoContent, body: undefined }
  }
}
