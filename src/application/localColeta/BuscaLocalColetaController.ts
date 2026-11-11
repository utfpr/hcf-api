import { BuscaLocalColetaPorIdUseCase } from '@/domain/localColeta/BuscaLocalColetaPorIdUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  buscaLocalColetaPorIdUseCase: BuscaLocalColetaPorIdUseCase
}

export class BuscaLocalColetaController implements RequestHandler {
  private readonly buscaLocalColetaPorIdUseCase: BuscaLocalColetaPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.buscaLocalColetaPorIdUseCase = dependencies.buscaLocalColetaPorIdUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { localColetaId } = request.params as { localColetaId?: string }
    if (localColetaId === undefined || !/^\d+$/.test(localColetaId)) {
      return new BadRequestError({ message: 'localColetaId inválido' })
    }

    try {
      const localColeta = await this.buscaLocalColetaPorIdUseCase.execute(localColetaId)
      if (localColeta.left()) {
        return new InternalServerError({ message: localColeta.value.message })
      }
      if (!localColeta.value) return new NotFoundError({ message: 'Local de coleta não encontrado' })
      return { statusCode: StatusCode.Ok, body: localColeta.value }
    } catch (error) {
      return new InternalServerError({
        message: error instanceof Error ? error.message : 'Erro ao buscar local de coleta'
      })
    }
  }
}
