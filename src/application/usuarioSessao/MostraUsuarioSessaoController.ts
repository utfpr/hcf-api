import {
  type HttpRequest, type HttpResponse, StatusCode
} from '@/library/http/common'
import { type HttpError } from '@/library/http/error/HttpError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { notAuthorized } from './sessaoHttp'

/**
 * Controller responsável pelo endpoint de perfil da sessão ativa (GET /api/auth/me).
 * Devolve os dados do usuário autenticado e suas regras de permissão (CASL/RBAC).
 */
export class MostraUsuarioSessaoController implements RequestHandler {
  /**
   * Retorna os dados do usuário e regras de autorização anexadas à requisição pelo AuthorizeMiddleware.
   *
   * @param request Requisição HTTP autenticada.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 200 com informações do usuário e regras ou erro 401 Unauthorized.
   */
  handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    if (!request.user || !request.auth) {
      return Promise.resolve(notAuthorized())
    }

    return Promise.resolve({
      statusCode: StatusCode.Ok,
      body: {
        user: request.user,
        rules: request.auth.rules
      }
    })
  }
}
