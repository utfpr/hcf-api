import { BuscarSoloPorIdUseCase } from '@/domain/solo/BuscarSoloPorIdUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  buscarSoloPorIdUseCase: BuscarSoloPorIdUseCase
}

export class BuscarSoloController implements RequestHandler {
  private readonly buscarSoloPorIdUseCase: BuscarSoloPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.buscarSoloPorIdUseCase = dependencies.buscarSoloPorIdUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { soloId } = request.params as { soloId?: string }

    if (soloId === undefined || soloId === null || soloId === '' || !/^\d+$/.test(soloId)) {
      return new BadRequestError({ message: 'soloId inválido' })
    }

    const result = await this.buscarSoloPorIdUseCase.execute({ id: Number(soloId) })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Solo não encontrado' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
