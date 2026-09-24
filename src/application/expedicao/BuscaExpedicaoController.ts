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
      if (expedicaoId === undefined || expedicaoId === null || expedicaoId === '' || !/^\d+$/.test(expedicaoId)) {
        return new BadRequestError({ message: 'expedicaoId inválido' })
      }

      const result = await this.buscaExpedicaoUseCase.execute({ id: Number(expedicaoId) })

      // Falha na infra ou exceção de regra de negócio
      if (result.left()) {
        return new InternalServerError({ message: result.value.message })
      }

      // sucesso na querry, mas a expedição não encontrada
      if (!result.value) {
        return new NotFoundError({ message: 'Expedição não encontrada' })
      }

      // sucesso
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
