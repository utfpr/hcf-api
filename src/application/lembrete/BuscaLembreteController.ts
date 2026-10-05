import { BuscaLembreteUseCase } from '@/domain/lembrete/BuscaLembreteUseCase'
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
  buscaLembreteUseCase: BuscaLembreteUseCase
}

export class BuscaLembreteController implements RequestHandler {
  private readonly buscaLembreteUseCase: BuscaLembreteUseCase

  constructor(dependencies: Dependencies) {
    this.buscaLembreteUseCase = dependencies.buscaLembreteUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { lembreteId: rawLembreteId } = request.params as { lembreteId?: string }
    const lembreteId = parseId(rawLembreteId, 'lembreteId')
    if (lembreteId instanceof Error) return new BadRequestError({ message: lembreteId.message })

    const result = await this.buscaLembreteUseCase.execute({ id: lembreteId })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Lembrete não encontrado' })
    }

    return { body: result.value, statusCode: StatusCode.Ok }
  }
}
