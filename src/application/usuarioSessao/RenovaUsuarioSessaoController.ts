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

/**
 * Dependências requeridas pelo RenovaUsuarioSessaoController.
 */
interface Dependencies {
  renovaUsuarioSessaoUseCase: RenovaUsuarioSessaoUseCase
}

/**
 * Controller responsável pelo endpoint de renovação de tokens (POST /api/auth/refresh).
 * Recebe o refresh token via cookie HTTP-only ou corpo da requisição, rotaciona a sessão e emite novos tokens.
 */
export class RenovaUsuarioSessaoController implements RequestHandler {
  private readonly renovaUsuarioSessaoUseCase: RenovaUsuarioSessaoUseCase

  /**
   * @param dependencies Instância do caso de uso de renovação de sessão.
   */
  constructor(dependencies: Dependencies) {
    this.renovaUsuarioSessaoUseCase = dependencies.renovaUsuarioSessaoUseCase
  }

  /**
   * Processa a rotação de refresh token e renovação da sessão.
   *
   * @param request Requisição HTTP com refresh token via cookie ou corpo.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 200 com novos tokens e cookie atualizado ou 401 Unauthorized.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const refresh = resolveRefreshToken(request)
    if (!refresh) {
      return notAuthorized()
    }
    // Proteção contra CSRF: se o refresh token vier exclusivamente de cookie em requisições de navegador, exige cabeçalho 'x-requested-with'
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
