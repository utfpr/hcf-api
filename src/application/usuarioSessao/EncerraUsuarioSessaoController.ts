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

/**
 * Dependências requeridas pelo EncerraUsuarioSessaoController.
 */
interface Dependencies {
  accessToken: AccessToken
  encerraUsuarioSessaoUseCase: EncerraUsuarioSessaoUseCase
}

/**
 * Controller responsável pelo encerramento de sessão / logout (POST /api/auth/logout).
 * Revoga a sessão no banco e limpa o cookie HTTP-only do refresh token no navegador.
 */
export class EncerraUsuarioSessaoController implements RequestHandler {
  private readonly accessToken: AccessToken
  private readonly encerraUsuarioSessaoUseCase: EncerraUsuarioSessaoUseCase

  /**
   * @param dependencies Validador de access token e caso de uso de encerramento de sessão.
   */
  constructor(dependencies: Dependencies) {
    this.accessToken = dependencies.accessToken
    this.encerraUsuarioSessaoUseCase = dependencies.encerraUsuarioSessaoUseCase
  }

  /**
   * Processa a revogação da sessão atual ou de todas as sessões do usuário.
   *
   * @param request Requisição HTTP contendo tokens e opções de logout.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 204 NoContent com cookie expirado (Max-Age=0) ou erro 401/500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const refresh = resolveRefreshToken(request)
    const access = readBearerAccess(request)
    const verifiedAccess = access ? this.accessToken.verify(access) : undefined

    // Proteção contra CSRF: quando a requisição vem de navegador utilizando cookie de refresh sem cabeçalho Authorization, exige o cabeçalho 'x-requested-with'
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

    // Invalida o cookie HTTP-only no cliente definindo Max-Age=0
    return {
      ...response,
      headers: {
        ...response.headers,
        'Set-Cookie': serializeClearedRefreshCookie()
      }
    }
  }
}
