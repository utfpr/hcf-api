import { BuscaExpedicaoUseCase } from '@/domain/expedicao/BuscaExpedicaoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  buscaExpedicaoUseCase: BuscaExpedicaoUseCase
}

interface CustomHttpRequest extends HttpRequest {
  params: Record<string, string | undefined>
}

export class BuscaExpedicaoController implements RequestHandler {
  private readonly buscaExpedicaoUseCase: BuscaExpedicaoUseCase

  constructor(dependencies: Dependencies) {
    this.buscaExpedicaoUseCase = dependencies.buscaExpedicaoUseCase
  }

  // Busca expedição por ID
  // GET /v2/expedicoes/:expedicaoId
  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const { expedicaoId } = request.params

      // validação id
      if (!expedicaoId || Number.isNaN(Number(expedicaoId))) {
        return new BadRequestError({ message: 'O ID da expedição é inválido.' })
      }

      const result = await this.buscaExpedicaoUseCase.execute(Number(expedicaoId))

      // se falhouo assumimos que não encontrou a expedição, então retornamos 404
      if (result.left()) {
        return new NotFoundError({ message: result.value.message })
      }

      return {
        statusCode: StatusCode.Ok,
        body: result.value
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao buscar expedição por ID'
      return new InternalServerError({ message: errorMessage })
    }
  }
}
