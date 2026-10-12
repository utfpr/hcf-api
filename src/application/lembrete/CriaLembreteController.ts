import { CriaLembreteUseCase } from '@/domain/lembrete/CriaLembreteUseCase'
import { FichaAttributes } from '@/domain/lembrete/Lembrete'
import { InfrastructureError } from '@/infrastructure/error/InfrastructureError'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

import { parseFicha, parseRequiredString } from './lembrete-parsing'

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

    // Substituir por request.usuario.id assim que a
    // autenticação for integrada.
    const usuarioId = null

    const result = await this.criaLembreteUseCase.execute({
      ...ficha as FichaAttributes,
      created_by: usuarioId,
      data_coleta: dataColeta,
      local_coleta: localColeta
    })

    if (result.left()) {
      const error = result.value
      if (!(error instanceof InfrastructureError)) return new BadRequestError({ message: error.message })
      return new InternalServerError({ message: error.message })
    }

    return { body: result.value, statusCode: StatusCode.Created }
  }
}
