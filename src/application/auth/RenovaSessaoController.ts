import { RenovaSessaoUseCase } from '@/domain/auth/RenovaSessaoUseCase'
import { type HttpRequest, type HttpResponse } from '@/library/http/common'
import { type HttpError } from '@/library/http/error/HttpError'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { clearRefreshCookieHeader } from './refreshCookieHeader'
import { requestedWithHeader, resolveRefreshToken } from './requestAuth'
import { toAccessTokenHttpResponse } from './toAccessTokenHttpResponse'
import { toHttpError } from './toHttpError'

interface Dependencies {
  renovaSessaoUseCase: RenovaSessaoUseCase
}

export class RenovaSessaoController implements RequestHandler {
  private readonly renovaSessaoUseCase: RenovaSessaoUseCase

  constructor(dependencies: Dependencies) {
    this.renovaSessaoUseCase = dependencies.renovaSessaoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const resolved = resolveRefreshToken(request)
    const clearHeaders = resolved.cookiePresent
      ? { 'Set-Cookie': clearRefreshCookieHeader() }
      : undefined

    if (resolved.fromCookie && !requestedWithHeader(request)) {
      return new UnauthorizedError({
        message: 'Missing CSRF header',
        headers: clearHeaders
      })
    }

    if (!resolved.token) {
      return new UnauthorizedError({
        message: 'Refresh token is required',
        headers: clearHeaders
      })
    }

    const result = await this.renovaSessaoUseCase.execute({ refreshToken: resolved.token })
    if (result.left()) {
      return toHttpError(result.value, clearHeaders)
    }

    return toAccessTokenHttpResponse(result.value)
  }
}
