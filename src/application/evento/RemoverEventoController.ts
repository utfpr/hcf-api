import { RemoverEventoUseCase } from '@/domain/evento/RemoverEventoUseCase'
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
  removerEventoUseCase: RemoverEventoUseCase
}

export class RemoverEventoController implements RequestHandler {
  private readonly removerEventoUseCase: RemoverEventoUseCase

  constructor(dependencies: Dependencies) {
    this.removerEventoUseCase = dependencies.removerEventoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { eventoId: rawEventoId } = request.params as { eventoId?: string }
    const eventoId = parseId(rawEventoId, 'eventoId')
    if (eventoId instanceof Error) return new BadRequestError({ message: eventoId.message })

    const result = await this.removerEventoUseCase.execute({ id: eventoId })

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
