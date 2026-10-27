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

export class ListaLembreteEvidenciasController implements RequestHandler {
  private readonly lembreteEvidenciaCollection: LembreteEvidenciaCollection

  constructor(dependencies: Dependencies) {
    this.lembreteEvidenciaCollection = dependencies.lembreteEvidenciaCollection
  }

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
