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
  parseFicha, parseId, parseOptionalNumber, parseOptionalString, parseRequiredString
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

    const input: AtualizaLembreteInput = {
      ...ficha, id: lembreteId, updated_by: request.user?.id ?? null
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

    const descricao = parseOptionalString(body.descricao, 'descricao')
    if (descricao instanceof Error) return new BadRequestError({ message: descricao.message })
    if (descricao !== undefined) input.descricao = descricao

    const latitude = parseOptionalNumber(body.latitude, 'latitude')
    if (latitude instanceof Error) return new BadRequestError({ message: latitude.message })
    if (latitude !== undefined) input.latitude = latitude

    const longitude = parseOptionalNumber(body.longitude, 'longitude')
    if (longitude instanceof Error) return new BadRequestError({ message: longitude.message })
    if (longitude !== undefined) input.longitude = longitude

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
