import { type ApagaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessaoUseCase'
import { type ApagaUsuarioSessoesUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessoesUseCase'
import { type BuscaUsuarioSessaoPorHashUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorHashUseCase'
import { type AccessToken } from '@/library/auth/AccessToken'
import { type RefreshToken } from '@/library/auth/RefreshToken'
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
  naoAutorizado,
  readBearerAccess,
  resolveRefreshToken
} from './sessaoHttp'

interface Dependencies {
  refreshToken: RefreshToken
  accessToken: AccessToken
  buscaUsuarioSessaoPorHashUseCase: BuscaUsuarioSessaoPorHashUseCase
  apagaUsuarioSessaoUseCase: ApagaUsuarioSessaoUseCase
  apagaUsuarioSessoesUseCase: ApagaUsuarioSessoesUseCase
}

export class EncerraSessaoController implements RequestHandler {
  private readonly refreshToken: RefreshToken
  private readonly accessToken: AccessToken
  private readonly buscaUsuarioSessaoPorHashUseCase: BuscaUsuarioSessaoPorHashUseCase
  private readonly apagaUsuarioSessaoUseCase: ApagaUsuarioSessaoUseCase
  private readonly apagaUsuarioSessoesUseCase: ApagaUsuarioSessoesUseCase

  constructor(dependencies: Dependencies) {
    this.refreshToken = dependencies.refreshToken
    this.accessToken = dependencies.accessToken
    this.buscaUsuarioSessaoPorHashUseCase = dependencies.buscaUsuarioSessaoPorHashUseCase
    this.apagaUsuarioSessaoUseCase = dependencies.apagaUsuarioSessaoUseCase
    this.apagaUsuarioSessoesUseCase = dependencies.apagaUsuarioSessoesUseCase
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
      return naoAutorizado()
    }

    if (logoutAllRequested(request.body)) {
      if (!verifiedAccess || verifiedAccess.left()) {
        return this.cleared(naoAutorizado())
      }

      const deletedAll = await this.apagaUsuarioSessoesUseCase.execute({
        usuarioId: verifiedAccess.value.sub
      })
      if (deletedAll.left()) {
        return new InternalServerError({ message: deletedAll.value.message })
      }

      return this.cleared({ statusCode: StatusCode.NoContent })
    }

    if (refresh) {
      const hashed = this.refreshToken.hash(refresh.token)
      if (hashed.left()) {
        return this.cleared(naoAutorizado())
      }

      const found = await this.buscaUsuarioSessaoPorHashUseCase.execute({
        refreshTokenHash: hashed.value
      })
      if (found.left()) {
        return new InternalServerError({ message: found.value.message })
      }
      if (found.value) {
        const deleted = await this.apagaUsuarioSessaoUseCase.execute({ id: found.value.id })
        if (deleted.left()) {
          return new InternalServerError({ message: deleted.value.message })
        }
      }

      return this.cleared({ statusCode: StatusCode.NoContent })
    }

    if (!verifiedAccess || verifiedAccess.left()) {
      return this.cleared(naoAutorizado())
    }

    const deleted = await this.apagaUsuarioSessaoUseCase.execute({ id: verifiedAccess.value.sid })
    if (deleted.left()) {
      return new InternalServerError({ message: deleted.value.message })
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
