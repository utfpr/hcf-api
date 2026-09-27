import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { type RenovaSessaoUseCase } from '@/domain/usuarioSessao/RenovaSessaoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { serializeRefreshCookie } from './refreshCookie'
import {
  hasCsrfHeader, looksLikeBrowserRequest, naoAutorizado, resolveRefreshToken, sessaoResponseBody
} from './sessaoHttp'

interface Dependencies {
  renovaSessaoUseCase: RenovaSessaoUseCase
}

export class RenovaSessaoController implements RequestHandler {
  private readonly renovaSessaoUseCase: RenovaSessaoUseCase

  constructor(dependencies: Dependencies) {
    this.renovaSessaoUseCase = dependencies.renovaSessaoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const refresh = resolveRefreshToken(request)
    if (!refresh) {
      return naoAutorizado()
    }
    if (refresh.cookieOnly && looksLikeBrowserRequest(request) && !hasCsrfHeader(request)) {
      return naoAutorizado()
    }

    const result = await this.renovaSessaoUseCase.execute({ refreshToken: refresh.token })
    if (result.left()) {
      if (result.value instanceof UserSessionNotFoundError) {
        return naoAutorizado()
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
