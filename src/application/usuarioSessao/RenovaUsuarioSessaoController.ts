import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { type RenovaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/RenovaUsuarioSessaoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { serializeRefreshCookie } from './refreshCookie'
import {
  hasCsrfHeader, looksLikeBrowserRequest, notAuthorized, resolveRefreshToken, sessaoResponseBody
} from './sessaoHttp'

interface Dependencies {
  renovaUsuarioSessaoUseCase: RenovaUsuarioSessaoUseCase
}

export class RenovaUsuarioSessaoController implements RequestHandler {
  private readonly renovaUsuarioSessaoUseCase: RenovaUsuarioSessaoUseCase

  constructor(dependencies: Dependencies) {
    this.renovaUsuarioSessaoUseCase = dependencies.renovaUsuarioSessaoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const refresh = resolveRefreshToken(request)
    if (!refresh) {
      return notAuthorized()
    }
    if (refresh.cookieOnly && looksLikeBrowserRequest(request) && !hasCsrfHeader(request)) {
      return notAuthorized()
    }

    const result = await this.renovaUsuarioSessaoUseCase.execute({ refreshToken: refresh.token })
    if (result.left()) {
      if (result.value instanceof UserSessionNotFoundError) {
        return notAuthorized()
      }
      return new InternalServerError({ message: result.value.message })
    }

    return {
      statusCode: StatusCode.Ok,
      headers: { 'Set-Cookie': serializeRefreshCookie(result.value.refreshToken) },
      body: sessaoResponseBody(result.value)
    }
  }
}
