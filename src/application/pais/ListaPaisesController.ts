import { ListaPaisesUseCase } from '@/domain/pais/ListaPaisesUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaPaisesUseCase: ListaPaisesUseCase
}

/**
 * Controller responsável pela listagem de países com filtro opcional por nome.
 */
export class ListaPaisesController implements RequestHandler {
  private readonly listaPaisesUseCase: ListaPaisesUseCase

  constructor(dependencies: Dependencies) {
    this.listaPaisesUseCase = dependencies.listaPaisesUseCase
  }

  /**
   * Trata a requisição GET /v1/paises.
   *
   * @param request Requisição HTTP com parâmetro de filtro por nome.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 200 com lista de países ou 500 em erro interno.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const result = await this.listaPaisesUseCase.execute({
      nome: request.params.nome as string | undefined
    })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
