import { RemoveEventoUseCase } from '@/domain/evento/RemoveEventoUseCase'
import { CheckViolationError } from '@/infrastructure/error/CheckViolationError'
import { ForeignKeyViolationError } from '@/infrastructure/error/ForeignKeyViolationError'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { UnprocessableEntityError } from '@/library/http/error/UnprocessableEntityError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  removeEventoUseCase: RemoveEventoUseCase
}

/**
 * Controller responsável pelo endpoint de exclusão de eventos (DELETE /api/v1/eventos/:eventoId).
 */
export class RemoveEventoController implements RequestHandler {
  private readonly removeEventoUseCase: RemoveEventoUseCase

  /**
   * @param dependencies Instância do caso de uso de remoção de evento.
   */
  constructor(dependencies: Dependencies) {
    this.removeEventoUseCase = dependencies.removeEventoUseCase
  }

  /**
   * Executa a remoção do evento informado pelo parâmetro ':eventoId'.
   *
   * @param request Requisição HTTP com ':eventoId'.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 204 NoContent, 404 se não encontrado ou 400/500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { eventoId: rawEventoId } = request.params as { eventoId?: string }
    const eventoId = parseId(rawEventoId, 'eventoId')
    if (eventoId instanceof Error) return new BadRequestError({ message: eventoId.message })

    const result = await this.removeEventoUseCase.execute({ id: eventoId })

    if (result.left()) {
      const error = result.value
      if (error instanceof ForeignKeyViolationError) return new NotFoundError({ message: error.message })
      if (error instanceof CheckViolationError) return new UnprocessableEntityError({ message: error.message })
      return new InternalServerError({ message: error.message })
    }
    if (!result.value) {
      return new NotFoundError({ message: 'Evento não encontrado' })
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
