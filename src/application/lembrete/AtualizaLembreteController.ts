import { AtualizaLembreteUseCase, Input as AtualizaLembreteInput } from '@/domain/lembrete/AtualizaLembreteUseCase'
import { InfrastructureError } from '@/infrastructure/error/InfrastructureError'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

import {
  parseFicha, parseId, parseRequiredString
} from './lembrete-parsing'

interface Dependencies {
  atualizaLembreteUseCase: AtualizaLembreteUseCase
}

export class AtualizaLembreteController implements RequestHandler {
  private readonly atualizaLembreteUseCase: AtualizaLembreteUseCase

  constructor(dependencies: Dependencies) {
    this.atualizaLembreteUseCase = dependencies.atualizaLembreteUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { lembreteId: rawLembreteId } = request.params as { lembreteId?: string }
    const lembreteId = parseId(rawLembreteId, 'lembreteId')
    if (lembreteId instanceof Error) return new BadRequestError({ message: lembreteId.message })

    const body = (request.body ?? {}) as Record<string, unknown>

    const ficha = parseFicha(body, { preencherAusentes: false })
    if (ficha instanceof Error) return new BadRequestError({ message: ficha.message })

    // Substituir por request.usuario.id assim que a
    // autenticação for integrada.
    const input: AtualizaLembreteInput = {
      ...ficha, id: lembreteId, updated_by: null
    }

    if (body.data_coleta !== undefined) {
      const dataColeta = parseRequiredString(body.data_coleta, 'data_coleta')
      if (dataColeta instanceof Error) return new BadRequestError({ message: dataColeta.message })
      input.data_coleta = dataColeta
    }

    if (body.local_coleta !== undefined) {
      const localColeta = parseRequiredString(body.local_coleta, 'local_coleta')
      if (localColeta instanceof Error) return new BadRequestError({ message: localColeta.message })
      input.local_coleta = localColeta
    }

    const result = await this.atualizaLembreteUseCase.execute(input)

    if (result.left()) {
      const error = result.value
      if (!(error instanceof InfrastructureError)) return new BadRequestError({ message: error.message })
      return new InternalServerError({ message: error.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Lembrete não encontrado' })
    }

    return { body: result.value, statusCode: StatusCode.Ok }
  }
}
