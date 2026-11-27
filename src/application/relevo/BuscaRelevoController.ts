import { BuscaRelevoPorIdUseCase } from '@/domain/relevo/BuscaRelevoPorIdUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  buscaRelevoPorIdUseCase: BuscaRelevoPorIdUseCase
}

/**
 * Controller responsável pela busca de um relevo por ID.
 */
export class BuscaRelevoController implements RequestHandler {
  private readonly buscaRelevoPorIdUseCase: BuscaRelevoPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.buscaRelevoPorIdUseCase = dependencies.buscaRelevoPorIdUseCase
  }

  /**
   * Trata a requisição GET /v1/relevos/:relevoId validando o ID informado.
   *
   * @param request Requisição HTTP com parâmetro de rota relevoId.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 200 com os dados do relevo, 400 se ID inválido, 404 se não encontrado ou 500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { relevoId } = request.params as { relevoId?: string }

    if (relevoId === undefined || relevoId === null || relevoId === '' || !/^\d+$/.test(relevoId)) {
      return new BadRequestError({ message: 'relevoId inválido' })
    }

    const result = await this.buscaRelevoPorIdUseCase.execute({ id: relevoId })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Relevo não encontrado' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
