import { ExpedicaoNaoEncontradaError } from '@/domain/expedicao/error/ExpedicaoNaoEncontradaError'
import { ExpedicaoCollection } from '@/domain/expedicao/ExpedicaoCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

interface CustomHttpRequest extends HttpRequest {
  params: Record<string, string | undefined>
}

export class DeletaExpedicaoController implements RequestHandler {
  private readonly expedicaoCollection: ExpedicaoCollection

  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const { expedicaoId } = request.params

      if (expedicaoId === undefined || expedicaoId === null || expedicaoId === '' || !/^\d+$/.test(expedicaoId)) {
        return new BadRequestError({ message: 'O ID da expedição é inválido.' })
      }

      const result = await this.expedicaoCollection.delete(Number(expedicaoId))

      if (result.left()) {
        // Distingue não encontrado (404) de erro no banco (500)
        if (result.value instanceof ExpedicaoNaoEncontradaError) {
          return new NotFoundError({ message: result.value.message })
        }
        return new InternalServerError({ message: result.value.message })
      }

      return {
        statusCode: StatusCode.NoContent
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao deletar a expedição.'
      return new InternalServerError({ message: errorMessage })
    }
  }
}
