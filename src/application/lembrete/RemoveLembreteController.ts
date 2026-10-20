import { LembreteCollection } from '@/domain/lembrete/LembreteCollection'
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
  lembreteCollection: LembreteCollection
}

export class RemoveLembreteController implements RequestHandler {
  private readonly lembreteCollection: LembreteCollection

  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { lembreteId: rawLembreteId } = request.params as { lembreteId?: string }
    const lembreteId = parseId(rawLembreteId, 'lembreteId')
    if (lembreteId instanceof Error) return new BadRequestError({ message: lembreteId.message })

    const result = await this.lembreteCollection.delete(lembreteId)

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Lembrete não encontrado' })
    }

    return { statusCode: StatusCode.NoContent }
  }
}
