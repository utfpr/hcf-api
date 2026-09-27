import { ConfirmaSessaoAcessoUseCase } from '@/domain/auth/ConfirmaSessaoAcessoUseCase'
import { EncerraSessaoUseCase } from '@/domain/auth/EncerraSessaoUseCase'
import { BuscaUsuarioSessaoPorHashUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorHashUseCase'
import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import {
  type HttpRequest, type HttpResponse, StatusCode
} from '@/library/http/common'
import { type HttpError } from '@/library/http/error/HttpError'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { clearRefreshCookieHeader } from './refreshCookieHeader'
import {
  bearerAccessToken, requestedWithHeader, resolveRefreshToken
} from './requestAuth'
import { toHttpError } from './toHttpError'

interface Dependencies {
  encerraSessaoUseCase: EncerraSessaoUseCase
  confirmaSessaoAcessoUseCase: ConfirmaSessaoAcessoUseCase
  buscaUsuarioSessaoPorHashUseCase: BuscaUsuarioSessaoPorHashUseCase
  refreshToken: RefreshToken
}

export class EncerraSessaoController implements RequestHandler {
  private readonly encerraSessaoUseCase: EncerraSessaoUseCase
  private readonly confirmaSessaoAcessoUseCase: ConfirmaSessaoAcessoUseCase
  private readonly buscaUsuarioSessaoPorHashUseCase: BuscaUsuarioSessaoPorHashUseCase
  private readonly refreshToken: RefreshToken

  constructor(dependencies: Dependencies) {
    this.encerraSessaoUseCase = dependencies.encerraSessaoUseCase
    this.confirmaSessaoAcessoUseCase = dependencies.confirmaSessaoAcessoUseCase
    this.buscaUsuarioSessaoPorHashUseCase = dependencies.buscaUsuarioSessaoPorHashUseCase
    this.refreshToken = dependencies.refreshToken
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const all = Boolean((request.body as { all?: unknown } | undefined)?.all)
    const clearHeaders = { 'Set-Cookie': clearRefreshCookieHeader() }
    const success = {
      statusCode: StatusCode.NoContent,
      headers: clearHeaders
    } satisfies HttpResponse

    if (all) {
      const accessToken = bearerAccessToken(request)
      if (!accessToken) {
        return toHttpError(new AccessTokenInvalidError())
      }

      const access = await this.confirmaSessaoAcessoUseCase.execute({ accessToken })
      if (access.left()) {
        return toHttpError(access.value)
      }

      const deleted = await this.encerraSessaoUseCase.execute({
        all: true,
        usuarioId: access.value.sub
      })
      if (deleted.left()) {
        return toHttpError(deleted.value)
      }

      return success
    }

    const resolved = resolveRefreshToken(request)
    if (resolved.fromCookie && !requestedWithHeader(request)) {
      return new UnauthorizedError({
        message: 'Missing CSRF header',
        headers: resolved.cookiePresent ? clearHeaders : undefined
      })
    }

    if (resolved.token) {
      const hashed = this.refreshToken.hash(resolved.token)
      if (hashed.left()) {
        return toHttpError(hashed.value, resolved.cookiePresent ? clearHeaders : undefined)
      }

      const session = await this.buscaUsuarioSessaoPorHashUseCase.execute({
        refreshTokenHash: hashed.value
      })
      if (session.left()) {
        return toHttpError(session.value, resolved.cookiePresent ? clearHeaders : undefined)
      }
      if (!session.value) {
        return toHttpError(
          new UserSessionNotFoundError(),
          resolved.cookiePresent ? clearHeaders : undefined
        )
      }

      const deleted = await this.encerraSessaoUseCase.execute({
        all: false,
        sessaoId: session.value.id
      })
      if (deleted.left()) {
        return toHttpError(deleted.value)
      }

      return success
    }

    const accessToken = bearerAccessToken(request)
    if (!accessToken) {
      return new UnauthorizedError({
        message: 'Refresh or access token is required'
      })
    }

    const access = await this.confirmaSessaoAcessoUseCase.execute({ accessToken })
    if (access.left()) {
      return toHttpError(access.value)
    }

    const deleted = await this.encerraSessaoUseCase.execute({
      all: false,
      sessaoId: access.value.sid
    })
    if (deleted.left()) {
      return toHttpError(deleted.value)
    }

    return success
  }
}
