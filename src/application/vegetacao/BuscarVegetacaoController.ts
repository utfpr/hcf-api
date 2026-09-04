import { BuscarVegetacaoPorIdUseCase } from '@/domain/vegetacao/BuscarVegetacaoPorIdUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  buscarVegetacaoPorIdUseCase: BuscarVegetacaoPorIdUseCase
}

export class BuscarVegetacaoController implements RequestHandler {
  private readonly buscarVegetacaoPorIdUseCase: BuscarVegetacaoPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.buscarVegetacaoPorIdUseCase = dependencies.buscarVegetacaoPorIdUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { vegetacaoId } = request.params as { vegetacaoId?: string }

    if (vegetacaoId === undefined || vegetacaoId === null || vegetacaoId === '' || !/^\d+$/.test(vegetacaoId)) {
      return new BadRequestError({ message: 'vegetacaoId inválido' })
    }

    const result = await this.buscarVegetacaoPorIdUseCase.execute({ id: Number(vegetacaoId) })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Vegetação não encontrada' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
