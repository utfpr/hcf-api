import { InvalidCredentialsError } from '@/domain/usuario/error/InvalidCredentialsError'
import { type CriaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/CriaUsuarioSessaoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { serializeRefreshCookie } from './refreshCookie'
import { credenciaisInvalidas, sessaoResponseBody } from './sessaoHttp'

/**
 * Dependências requeridas pelo CriaUsuarioSessaoController.
 */
interface Dependencies {
  criaUsuarioSessaoUseCase: CriaUsuarioSessaoUseCase
}

/**
 * Controller responsável pelo endpoint de autenticação de usuários (POST /api/auth/login).
 * Recebe credenciais, cria uma sessão e responde com access token e cookie HTTP-only de refresh token.
 */
export class CriaUsuarioSessaoController implements RequestHandler {
  private readonly criaUsuarioSessaoUseCase: CriaUsuarioSessaoUseCase

  /**
   * @param dependencies Instância do caso de uso de criação de sessão.
   */
  constructor(dependencies: Dependencies) {
    this.criaUsuarioSessaoUseCase = dependencies.criaUsuarioSessaoUseCase
  }

  /**
   * Processa a autenticação do usuário via e-mail e senha.
   *
   * @param request Requisição HTTP contendo corpo com 'email' e 'senha'.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 200 com tokens e cabeçalho 'Set-Cookie' ou erro de credenciais inválidas (401).
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const body = request.body as { email?: unknown; senha?: unknown }
    const email = typeof body?.email === 'string' ? body.email : ''
    const senha = typeof body?.senha === 'string' ? body.senha : ''

    const result = await this.criaUsuarioSessaoUseCase.execute({ email, senha })
    if (result.left()) {
      if (result.value instanceof InvalidCredentialsError) {
        return credenciaisInvalidas()
      }
      return new InternalServerError({ message: result.value.message })
    }

    // Define o refresh token em cookie HTTP-only para segurança em clientes web e devolve no corpo JSON para clientes móveis
    return {
      statusCode: StatusCode.Ok,
      headers: { 'Set-Cookie': serializeRefreshCookie(result.value.refreshToken) },
      body: sessaoResponseBody(result.value)
    }
  }
}
