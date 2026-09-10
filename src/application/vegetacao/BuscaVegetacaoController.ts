import { BuscaVegetacaoPorIdUseCase } from '@/domain/vegetacao/BuscaVegetacaoPorIdUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  buscaVegetacaoPorIdUseCase: BuscaVegetacaoPorIdUseCase
}

export class BuscaVegetacaoController implements RequestHandler {
  private readonly buscaVegetacaoPorIdUseCase: BuscaVegetacaoPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.buscaVegetacaoPorIdUseCase = dependencies.buscaVegetacaoPorIdUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { vegetacaoId } = request.params as { vegetacaoId?: string }

    if (vegetacaoId === undefined || vegetacaoId === null || vegetacaoId === '' || !/^\d+$/.test(vegetacaoId)) {
      return new BadRequestError({ message: 'vegetacaoId inválido' })
    }

    const result = await this.buscaVegetacaoPorIdUseCase.execute({ id: Number(vegetacaoId) })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Vegetação não encontrada' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
