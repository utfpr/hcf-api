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

/**
 * Controller responsável por receber requisições de consulta de solo por ID.
 */
export class BuscaSoloController implements RequestHandler {
  private readonly buscaSoloPorIdUseCase: BuscaSoloPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.buscaSoloPorIdUseCase = dependencies.buscaSoloPorIdUseCase
  }

  /**
   * Trata a requisição GET /v1/solos/:soloId validando os parâmetros de rota.
   *
   * @param request Requisição HTTP com parâmetro de rota soloId.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 200 com os dados do solo, 400 se ID for inválido, 404 se não encontrado ou 500 em falhas internas.
   */
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
