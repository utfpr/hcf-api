import { BuscaSoloPorIdUseCase } from '@/domain/solo/BuscaSoloPorIdUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  buscaSoloPorIdUseCase: BuscaSoloPorIdUseCase
}

export class BuscaSoloController implements RequestHandler {
  private readonly buscaSoloPorIdUseCase: BuscaSoloPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.buscaSoloPorIdUseCase = dependencies.buscaSoloPorIdUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { soloId } = request.params as { soloId?: string }

    if (soloId === undefined || soloId === null || soloId === '' || !/^\d+$/.test(soloId)) {
      return new BadRequestError({ message: 'soloId inválido' })
    }

    const result = await this.buscaSoloPorIdUseCase.execute({ id: Number(soloId) })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Solo não encontrado' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
