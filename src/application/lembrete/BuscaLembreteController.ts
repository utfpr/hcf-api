import { LembreteCollection } from '@/domain/lembrete/LembreteCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

import { parseId } from './lembrete-parsing'

interface Dependencies {
  lembreteCollection: LembreteCollection
}

/**
 * Controller responsável pelo endpoint de busca de lembrete por ID (GET /api/v1/lembretes/:lembreteId).
 */
export class BuscaLembreteController implements RequestHandler {
  private readonly lembreteCollection: LembreteCollection

  /**
   * @param dependencies Repositório de lembretes.
   */
  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
  }

  /**
   * Localiza e devolve o lembrete informado pelo identificador na rota.
   *
   * @param request Requisição HTTP contendo ':lembreteId'.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 200 com os dados do lembrete, 400 se ID inválido ou 404/500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { lembreteId: rawLembreteId } = request.params as { lembreteId?: string }
    const lembreteId = parseId(rawLembreteId, 'lembreteId')
    if (lembreteId instanceof Error) return new BadRequestError({ message: lembreteId.message })

    const result = await this.lembreteCollection.findById(lembreteId)

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Lembrete não encontrado' })
    }

    return { body: result.value, statusCode: StatusCode.Ok }
  }
}
