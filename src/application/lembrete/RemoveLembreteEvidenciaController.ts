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

export class RemoveLembreteEvidenciaController implements RequestHandler {
  private readonly removeLembreteEvidenciaUseCase: RemoveLembreteEvidenciaUseCase

  constructor(dependencies: Dependencies) {
    this.removeLembreteEvidenciaUseCase = dependencies.removeLembreteEvidenciaUseCase
  }

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
