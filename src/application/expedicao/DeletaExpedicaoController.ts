import { DeletaExpedicaoUseCase } from '@/domain/expedicao/DeletaExpedicaoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  deletaExpedicaoUseCase: DeletaExpedicaoUseCase
}

interface CustomHttpRequest extends HttpRequest {
  params: Record<string, string | undefined>
}

export class DeletaExpedicaoController implements RequestHandler {
  private readonly deletaExpedicaoUseCase: DeletaExpedicaoUseCase

  constructor(dependencies: Dependencies) {
    this.deletaExpedicaoUseCase = dependencies.deletaExpedicaoUseCase
  }

  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const { expedicaoId } = request.params

      if (expedicaoId === undefined || expedicaoId === null || expedicaoId === '' || !/^\d+$/.test(expedicaoId)) {
        return new BadRequestError({ message: 'O ID da expedição é inválido.' })
      }

      const result = await this.deletaExpedicaoUseCase.execute({ id: Number(expedicaoId) })

      if (result.left()) {
        // Distingue não encontrado (404) de erro no banco (500)
        if (result.value.message === 'Expedição não encontrada') {
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
