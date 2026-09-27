import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { type MostraUsuarioSessaoUseCase } from '@/domain/usuarioSessao/MostraUsuarioSessaoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import {
  meResponseBody, notAuthorized, readBearerAccess
} from './sessaoHttp'

interface Dependencies {
  mostraUsuarioSessaoUseCase: MostraUsuarioSessaoUseCase
}

export class MostraUsuarioSessaoController implements RequestHandler {
  private readonly mostraUsuarioSessaoUseCase: MostraUsuarioSessaoUseCase

  constructor(dependencies: Dependencies) {
    this.mostraUsuarioSessaoUseCase = dependencies.mostraUsuarioSessaoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const token = readBearerAccess(request)
    if (!token) {
      return notAuthorized()
    }

    const result = await this.mostraUsuarioSessaoUseCase.execute({ accessToken: token })
    if (result.left()) {
      if (result.value instanceof UserSessionNotFoundError) {
        return notAuthorized()
      }
      return new InternalServerError({ message: result.value.message })
    }

    return {
      statusCode: StatusCode.Ok,
      body: meResponseBody(result.value)
    }
  }
}
