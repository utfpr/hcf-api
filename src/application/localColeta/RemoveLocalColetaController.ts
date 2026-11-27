import { LocalColetaEmUsoError } from '@/domain/localColeta/error/LocalColetaEmUsoError'
import { LocalColetaNaoEncontradaError } from '@/domain/localColeta/error/LocalColetaNaoEncontradaError'
import { RemoveLocalColetaUseCase } from '@/domain/localColeta/RemoveLocalColetaUseCase'
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
  removeLocalColetaUseCase: RemoveLocalColetaUseCase
}

/**
 * Controller responsável pela exclusão de um local de coleta.
 */
export class RemoveLocalColetaController implements RequestHandler {
  private readonly removeLocalColetaUseCase: RemoveLocalColetaUseCase

  constructor(dependencies: Dependencies) {
    this.removeLocalColetaUseCase = dependencies.removeLocalColetaUseCase
  }

  /**
   * Trata a requisição DELETE /v1/locais-coleta/:localColetaId.
   *
   * @param request Requisição HTTP com parâmetro localColetaId.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 204 se removido, 400 se ID inválido, 404 se não encontrado, 409 se em uso por tombos ou 500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { localColetaId } = request.params as { localColetaId?: string }
    if (localColetaId === undefined || localColetaId === null || localColetaId === '' || !/^\d+$/.test(localColetaId)) {
      return new BadRequestError({ message: 'localColetaId inválido' })
    }

    const result = await this.removeLocalColetaUseCase.execute(localColetaId)
    if (result.left()) {
      if (result.value instanceof LocalColetaEmUsoError) {
        return new ConflictError({ message: result.value.message })
      }
      if (result.value instanceof LocalColetaNaoEncontradaError) {
        return new NotFoundError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.NoContent }
  }
}
