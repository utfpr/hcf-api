import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { type MostraSessaoUseCase } from '@/domain/usuarioSessao/MostraSessaoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import {
  meResponseBody, naoAutorizado, readBearerAccess
} from './sessaoHttp'

interface Dependencies {
  mostraSessaoUseCase: MostraSessaoUseCase
}

export class MostraSessaoController implements RequestHandler {
  private readonly mostraSessaoUseCase: MostraSessaoUseCase

  constructor(dependencies: Dependencies) {
    this.mostraSessaoUseCase = dependencies.mostraSessaoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const token = readBearerAccess(request)
    if (!token) {
      return naoAutorizado()
    }

    const result = await this.mostraSessaoUseCase.execute({ accessToken: token })
    if (result.left()) {
      if (result.value instanceof UserSessionNotFoundError) {
        return naoAutorizado()
      }
      return new InternalServerError({ message: result.value.message })
    }

    return {
      statusCode: StatusCode.Ok,
      body: meResponseBody(result.value)
    }
  }
}
