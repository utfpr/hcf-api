import { VegetacaoCollection } from '@/domain/vegetacao/VegetacaoCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

/**
 * Controller responsável pela busca de um tipo de vegetação por ID.
 */
export class BuscaVegetacaoController implements RequestHandler {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  /**
   * Trata a requisição GET /v1/vegetacoes/:vegetacaoId.
   *
   * @param request Requisição HTTP com parâmetro vegetacaoId.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 200 com a vegetação, 400 se ID inválido, 404 se não encontrada ou 500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { vegetacaoId } = request.params as { vegetacaoId?: string }

    if (vegetacaoId === undefined || vegetacaoId === null || vegetacaoId === '' || !/^\d+$/.test(vegetacaoId)) {
      return new BadRequestError({ message: 'vegetacaoId inválido' })
    }

    const result = await this.vegetacaoCollection.findById(vegetacaoId)

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Vegetação não encontrada' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
