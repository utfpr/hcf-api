import { RemoveLembreteUseCase } from '@/domain/lembrete/RemoveLembreteUseCase'
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
  removeLembreteUseCase: RemoveLembreteUseCase
}

/**
 * Controller responsável pelo endpoint de exclusão de lembretes (DELETE /api/v1/lembretes/:lembreteId).
 */
export class RemoveLembreteController implements RequestHandler {
  private readonly removeLembreteUseCase: RemoveLembreteUseCase

  /**
   * @param dependencies Instância do caso de uso de remoção de lembrete.
   */
  constructor(dependencies: Dependencies) {
    this.removeLembreteUseCase = dependencies.removeLembreteUseCase
  }

  /**
   * Processa a remoção do lembrete e suas evidências associadas.
   *
   * @param request Requisição HTTP contendo ':lembreteId'.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 204 NoContent, 404 se não encontrado ou 400/500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { lembreteId: rawLembreteId } = request.params as { lembreteId?: string }
    const lembreteId = parseId(rawLembreteId, 'lembreteId')
    if (lembreteId instanceof Error) return new BadRequestError({ message: lembreteId.message })

    const result = await this.removeLembreteUseCase.execute({ id: lembreteId })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Lembrete não encontrado' })
    }

    return { statusCode: StatusCode.NoContent }
  }
}
