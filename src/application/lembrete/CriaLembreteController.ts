import { parseClientUuid } from '@/application/parseClientUuid'
import { CriaLembreteUseCase } from '@/domain/lembrete/CriaLembreteUseCase'
import { FichaAttributes } from '@/domain/lembrete/Lembrete'
import { ForeignKeyViolationError } from '@/infrastructure/error/ForeignKeyViolationError'
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
  parseExpedicaoId, parseFicha, parseRequiredString
} from './lembrete-parsing'

interface Dependencies {
  criaLembreteUseCase: CriaLembreteUseCase
}

export class CriaLembreteController implements RequestHandler {
  private readonly criaLembreteUseCase: CriaLembreteUseCase

  constructor(dependencies: Dependencies) {
    this.criaLembreteUseCase = dependencies.criaLembreteUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const body = (request.body ?? {}) as Record<string, unknown>

    const dataColeta = parseRequiredString(body.data_coleta, 'data_coleta')
    if (dataColeta instanceof Error) return new BadRequestError({ message: dataColeta.message })

    const localColeta = parseRequiredString(body.local_coleta, 'local_coleta')
    if (localColeta instanceof Error) return new BadRequestError({ message: localColeta.message })

    const ficha = parseFicha(body, { preencherAusentes: true })
    if (ficha instanceof Error) return new BadRequestError({ message: ficha.message })

    const clientUuid = parseClientUuid(body.client_uuid)
    if (clientUuid instanceof Error) return new BadRequestError({ message: clientUuid.message })

    const expedicaoId = parseExpedicaoId(body.expedicao_id)
    if (expedicaoId instanceof Error) return new BadRequestError({ message: expedicaoId.message })

    const usuarioId = request.user?.id ?? null

    const result = await this.criaLembreteUseCase.execute({
      ...ficha as FichaAttributes,
      created_by: usuarioId,
      data_coleta: dataColeta,
      local_coleta: localColeta,
      expedicao_id: expedicaoId,
      ...(clientUuid ? { client_uuid: clientUuid } : {})
    })

    if (result.left()) {
      const error = result.value
      if (!(error instanceof InfrastructureError)) return new BadRequestError({ message: error.message })
      if (error instanceof ForeignKeyViolationError) return new NotFoundError({ message: error.message })
      return new InternalServerError({ message: error.message })
    }

    return { body: result.value, statusCode: StatusCode.Created }
  }
}
