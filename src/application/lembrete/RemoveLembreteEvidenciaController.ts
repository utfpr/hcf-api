import { RemoveLembreteEvidenciaUseCase } from '@/domain/lembrete/RemoveLembreteEvidenciaUseCase'
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
  removeLembreteEvidenciaUseCase: RemoveLembreteEvidenciaUseCase
}

/**
 * Controller responsável pela exclusão de uma foto/evidência de um lembrete (DELETE /api/v1/lembretes/:lembreteId/evidencias/:evidenciaId).
 */
export class RemoveLembreteEvidenciaController implements RequestHandler {
  private readonly removeLembreteEvidenciaUseCase: RemoveLembreteEvidenciaUseCase

  /**
   * @param dependencies Instância do caso de uso de remoção de evidência de lembrete.
   */
  constructor(dependencies: Dependencies) {
    this.removeLembreteEvidenciaUseCase = dependencies.removeLembreteEvidenciaUseCase
  }

  /**
   * Executa a remoção do registro da evidência e do arquivo em disco se vinculada ao lembrete correto.
   *
   * @param request Requisição HTTP com ':lembreteId' e ':evidenciaId'.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 204 NoContent, 404 se não encontrada ou 400/500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const {
      lembreteId: rawLembreteId,
      evidenciaId: rawEvidenciaId
    } = request.params as { lembreteId?: string; evidenciaId?: string }

    const lembreteId = parseId(rawLembreteId, 'lembreteId')
    if (lembreteId instanceof Error) return new BadRequestError({ message: lembreteId.message })

    const evidenciaId = parseId(rawEvidenciaId, 'evidenciaId')
    if (evidenciaId instanceof Error) return new BadRequestError({ message: evidenciaId.message })

    const result = await this.removeLembreteEvidenciaUseCase.execute({ id: evidenciaId, lembreteId })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Evidência não encontrada' })
    }

    return { statusCode: StatusCode.NoContent }
  }
}
