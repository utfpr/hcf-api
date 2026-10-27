import { type EncerraUsuarioSessaoUseCase } from '@/domain/usuarioSessao/EncerraUsuarioSessaoUseCase'
import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { type AccessToken } from '@/library/auth/AccessToken'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { serializeClearedRefreshCookie } from './refreshCookie'
import {
  hasCsrfHeader,
  looksLikeBrowserRequest,
  logoutAllRequested,
  notAuthorized,
  readBearerAccess,
  resolveRefreshToken
} from './sessaoHttp'

interface Dependencies {
  accessToken: AccessToken
  encerraUsuarioSessaoUseCase: EncerraUsuarioSessaoUseCase
}

export class EncerraUsuarioSessaoController implements RequestHandler {
  private readonly accessToken: AccessToken
  private readonly encerraUsuarioSessaoUseCase: EncerraUsuarioSessaoUseCase

  constructor(dependencies: Dependencies) {
    this.accessToken = dependencies.accessToken
    this.encerraUsuarioSessaoUseCase = dependencies.encerraUsuarioSessaoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const refresh = resolveRefreshToken(request)
    const access = readBearerAccess(request)
    const verifiedAccess = access ? this.accessToken.verify(access) : undefined

    if (
      refresh?.cookieOnly
      && looksLikeBrowserRequest(request)
      && !hasCsrfHeader(request)
      && !verifiedAccess?.right()
    ) {
      return notAuthorized()
    }

    const result = await this.encerraUsuarioSessaoUseCase.execute({
      refreshToken: refresh?.token,
      accessToken: access,
      all: logoutAllRequested(request.body)
    })
    if (result.left()) {
      if (result.value instanceof UserSessionNotFoundError) {
        return this.cleared(notAuthorized())
      }
      return new InternalServerError({ message: result.value.message })
    }

    return this.cleared({ statusCode: StatusCode.NoContent })
  }

  private cleared(response: HttpResponse | HttpError): HttpResponse | HttpError {
    if (response instanceof HttpError) {
      return response
    }

    return {
      ...response,
      headers: {
        ...response.headers,
        'Set-Cookie': serializeClearedRefreshCookie()
      }
    }
  }
}
