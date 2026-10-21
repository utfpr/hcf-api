import { VegetacaoEmUsoError } from '@/domain/vegetacao/error/VegetacaoEmUsoError'
import { VegetacaoCollection } from '@/domain/vegetacao/VegetacaoCollection'
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
  vegetacaoCollection: VegetacaoCollection
}

export class RemoveVegetacaoController implements RequestHandler {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { vegetacaoId } = request.params as { vegetacaoId?: string }

    if (vegetacaoId === undefined || vegetacaoId === null || vegetacaoId === '' || !/^\d+$/.test(vegetacaoId)) {
      return new BadRequestError({ message: 'vegetacaoId inválido' })
    }

    const result = await this.vegetacaoCollection.delete(vegetacaoId)

    if (result.left()) {
      if (result.value instanceof VegetacaoEmUsoError) {
        return new ConflictError({ message: result.value.message })
      }
      return new InternalServerError({ message: 'Erro ao remover vegetação' })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Vegetação não encontrada' })
    }

    return { statusCode: StatusCode.NoContent, body: undefined }
  }
}
