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

export class RemoveEventoController implements RequestHandler {
  private readonly removeEventoUseCase: RemoveEventoUseCase

  constructor(dependencies: Dependencies) {
    this.removeEventoUseCase = dependencies.removeEventoUseCase
  }

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
