import { BuscarRelevoPorIdUseCase } from '@/domain/relevo/BuscarRelevoPorIdUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  buscarRelevoPorIdUseCase: BuscarRelevoPorIdUseCase
}

export class BuscarRelevoController implements RequestHandler {
  private readonly buscarRelevoPorIdUseCase: BuscarRelevoPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.buscarRelevoPorIdUseCase = dependencies.buscarRelevoPorIdUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { relevoId } = request.params as { relevoId?: string }

    if (relevoId === undefined || relevoId === null || relevoId === '' || !/^\d+$/.test(relevoId)) {
      return new BadRequestError({ message: 'relevoId inválido' })
    }

    const result = await this.buscarRelevoPorIdUseCase.execute({ id: Number(relevoId) })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Relevo não encontrado' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
