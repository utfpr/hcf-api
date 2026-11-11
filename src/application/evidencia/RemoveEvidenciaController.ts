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

export class RemoveEvidenciaController implements RequestHandler {
  private readonly removeEvidenciaUseCase: RemoveEvidenciaUseCase

  constructor(dependencies: Dependencies) {
    this.removeEvidenciaUseCase = dependencies.removeEvidenciaUseCase
  }

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
