import { RemoveEvidenciaUseCase } from '@/domain/evidencia/RemoveEvidenciaUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  removeEvidenciaUseCase: RemoveEvidenciaUseCase
}

/**
 * Controller responsável pelo endpoint de exclusão de evidência (DELETE /api/v1/evidencias/:evidenciaId).
 */
export class RemoveEvidenciaController implements RequestHandler {
  private readonly removeEvidenciaUseCase: RemoveEvidenciaUseCase

  /**
   * @param dependencies Instância do caso de uso de remoção de evidência.
   */
  constructor(dependencies: Dependencies) {
    this.removeEvidenciaUseCase = dependencies.removeEvidenciaUseCase
  }

  /**
   * Executa a remoção do registro da evidência e do respectivo arquivo em disco.
   *
   * @param request Requisição HTTP com ':evidenciaId'.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 204 NoContent, 404 se não encontrada ou 400/500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { evidenciaId: rawEvidenciaId } = request.params as { evidenciaId?: string }
    const evidenciaId = parseId(rawEvidenciaId, 'evidenciaId')
    if (evidenciaId instanceof Error) return new BadRequestError({ message: evidenciaId.message })

    const result = await this.removeEvidenciaUseCase.execute({ id: evidenciaId })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Evidência não encontrada' })
    }

    return { statusCode: StatusCode.NoContent }
  }
}

function parseId(raw: unknown, field: string): number | Error {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return new Error(`${field} inválido`)
  }
  return Number(raw)
}
