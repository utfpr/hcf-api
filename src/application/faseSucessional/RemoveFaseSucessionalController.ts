import { FaseSucessionalEmUsoError } from '@/domain/faseSucessional/error/FaseSucessionalEmUsoError'
import { FaseSucessionalCollection } from '@/domain/faseSucessional/FaseSucessionalCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

/**
 * Controller responsável pela remoção de uma fase sucessional.
 */
export class RemoveFaseSucessionalController implements RequestHandler {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  /**
   * Trata a requisição DELETE /v1/fases-sucessionais/:faseSucessionalId.
   *
   * @param request Requisição HTTP com parâmetro de rota faseSucessionalId.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 204 se removida, 400 se ID inválido, 404 se inexistente, 409 se em uso ou 500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { faseSucessionalId } = request.params as { faseSucessionalId?: string }

    if (faseSucessionalId === undefined || faseSucessionalId === null || faseSucessionalId === '' || !/^\d+$/.test(faseSucessionalId)) {
      return new BadRequestError({ message: 'faseSucessionalId inválido' })
    }

    const result = await this.faseSucessionalCollection.delete(faseSucessionalId)

    if (result.left()) {
      if (result.value instanceof FaseSucessionalEmUsoError) {
        return new ConflictError({ message: result.value.message })
      }

      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Fase sucessional não encontrada' })
    }

    return { statusCode: StatusCode.NoContent, body: undefined }
  }
}
