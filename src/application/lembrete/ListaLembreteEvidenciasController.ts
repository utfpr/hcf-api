import { LembreteEvidenciaCollection } from '@/domain/lembrete/LembreteEvidenciaCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

import { lembreteEvidenciaUrl, parseId } from './lembrete-parsing'

interface Dependencies {
  lembreteEvidenciaCollection: LembreteEvidenciaCollection
}

/**
 * Controller responsável pela listagem de fotos/evidências vinculadas a um lembrete (GET /api/v1/lembretes/:lembreteId/evidencias).
 */
export class ListaLembreteEvidenciasController implements RequestHandler {
  private readonly lembreteEvidenciaCollection: LembreteEvidenciaCollection

  /**
   * @param dependencies Repositório de evidências de lembrete.
   */
  constructor(dependencies: Dependencies) {
    this.lembreteEvidenciaCollection = dependencies.lembreteEvidenciaCollection
  }

  /**
   * Consulta e retorna a lista de evidências do lembrete com suas URLs públicas.
   *
   * @param request Requisição HTTP contendo ':lembreteId'.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 200 com lista de evidências ou 400/500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { lembreteId: rawLembreteId } = request.params as { lembreteId?: string }
    const lembreteId = parseId(rawLembreteId, 'lembreteId')
    if (lembreteId instanceof Error) return new BadRequestError({ message: lembreteId.message })

    const result = await this.lembreteEvidenciaCollection.findAll({ lembrete_id: lembreteId })
    if (result.left()) return new InternalServerError({ message: result.value.message })

    const body = result.value.map(evidencia => ({
      ...evidencia,
      url: lembreteEvidenciaUrl(evidencia.arquivo)
    }))

    return { body, statusCode: StatusCode.Ok }
  }
}
