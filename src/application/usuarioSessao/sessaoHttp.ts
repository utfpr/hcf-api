import { type Attributes } from '@/domain/usuario/Usuario'
import { createRules } from '@/library/auth/createRules'
import { type HttpRequest } from '@/library/http/common'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

import { REFRESH_COOKIE_NAME } from './refreshCookie'

export const ACCESS_EXPIRES_IN_SECONDS = 900

/**
 * Representação pública resumida do usuário autenticado retornada nos endpoints de sessão.
 */
export interface SessaoUsuario {
  id: number
  nome: string
  email: string
  tipo_usuario_id: number
}

/**
 * Cria erro de credenciais inválidas (401 Unauthorized).
 *
 * @returns Instância de UnauthorizedError formatada.
 */
export function credenciaisInvalidas(): UnauthorizedError {
  return new UnauthorizedError({ message: 'Credenciais inválidas' })
}

/**
 * Cria erro de acesso não autorizado genérico (401 Unauthorized).
 *
 * @returns Instância de UnauthorizedError.
 */
export function notAuthorized(): UnauthorizedError {
  return new UnauthorizedError({ message: 'Unauthorized' })
}

/**
 * Converte os atributos da entidade Usuario para o DTO de sessão.
 *
 * @param user Atributos do usuário.
 * @returns DTO SessaoUsuario.
 */
export function toSessaoUsuario(user: Attributes): SessaoUsuario {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo_usuario_id: user.tipoUsuarioId
  }
}

/**
 * Monta o corpo de resposta para requisições de login e renovação de sessão,
 * incluindo access token, refresh token, tempo de expiração e regras de autorização do CASL.
 *
 * @param params Parâmetros com tokens e dados do usuário.
 * @returns Objeto com o payload da sessão.
 */
export function sessaoResponseBody(params: {
  accessToken: string
  refreshToken: string
  user: Attributes
}) {
  const user = toSessaoUsuario(params.user)
  return {
    access_token: params.accessToken,
    refresh_token: params.refreshToken,
    token_type: 'Bearer',
    expires_in: ACCESS_EXPIRES_IN_SECONDS,
    user,
    rules: createRules({
      id: user.id,
      tipo_usuario_id: user.tipo_usuario_id
    })
  }
}

/**
 * Monta o corpo de resposta para o endpoint /api/auth/me contendo dados do usuário e regras ativas.
 *
 * @param user Atributos do usuário autenticado.
 * @returns Objeto formatado com dados do usuário e regras.
 */
export function meResponseBody(user: Attributes) {
  const dto = toSessaoUsuario(user)
  return {
    user: dto,
    rules: createRules({
      id: dto.id,
      tipo_usuario_id: dto.tipo_usuario_id
    })
  }
}

/**
 * Extrai o refresh token do corpo JSON da requisição (suporta 'refresh_token' ou 'refreshToken').
 *
 * @param body Corpo da requisição HTTP.
 * @returns String do refresh token ou undefined se ausente.
 */
export function readRefreshFromBody(body: unknown): string | undefined {
  if (body === null || typeof body !== 'object') {
    return undefined
  }

  const record = body as { refresh_token?: unknown; refreshToken?: unknown }
  const token = record.refresh_token ?? record.refreshToken
  return typeof token === 'string' && token.length > 0 ? token : undefined
}

/**
 * Resolve o refresh token a partir do corpo da requisição ou do cookie HTTP-only (priorizando o corpo).
 *
 * @param request Requisição HTTP.
 * @returns Objeto com o token e indicador se a origem foi exclusivamente por cookie, ou undefined se inexistente.
 */
export function resolveRefreshToken(request: HttpRequest): {
  token: string
  cookieOnly: boolean
} | undefined {
  const fromBody = readRefreshFromBody(request.body)
  if (fromBody) {
    return { token: fromBody, cookieOnly: false }
  }

  const fromCookie = request.cookies?.[REFRESH_COOKIE_NAME]
  if (typeof fromCookie === 'string' && fromCookie.length > 0) {
    return { token: fromCookie, cookieOnly: true }
  }

  return undefined
}

/**
 * Verifica se o cabeçalho 'x-requested-with' está presente para mitigação de CSRF.
 *
 * @param request Requisição HTTP.
 * @returns True se o cabeçalho estiver presente e não vazio.
 */
export function hasCsrfHeader(request: HttpRequest): boolean {
  const value = request.headers['x-requested-with']
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Avalia se a requisição originou de um navegador web inspecionando os cabeçalhos 'origin' ou 'referer'.
 *
 * @param request Requisição HTTP.
 * @returns True se os cabeçalhos sugerirem chamada oriunda de navegador.
 */
export function looksLikeBrowserRequest(request: HttpRequest): boolean {
  const origin = request.headers.origin
  const referer = request.headers.referer
  return (typeof origin === 'string' && origin.length > 0)
    || (typeof referer === 'string' && referer.length > 0)
}

/**
 * Extrai o access token do cabeçalho de autorização HTTP ('Authorization: Bearer <token>').
 *
 * @param request Requisição HTTP.
 * @returns String do access token ou undefined caso ausente ou mal formatado.
 */
export function readBearerAccess(request: HttpRequest): string | undefined {
  const value = request.headers.authorization ?? request.headers.Authorization
  if (typeof value !== 'string') {
    return undefined
  }

  const match = /^Bearer\s+(\S+)$/i.exec(value.trim())
  return match?.[1]
}

/**
 * Identifica se a requisição de logout solicita revogação global ({ all: true }).
 *
 * @param body Corpo da requisição HTTP.
 * @returns True se 'all' for booleano true.
 */
export function logoutAllRequested(body: unknown): boolean {
  if (body === null || typeof body !== 'object') {
    return false
  }

  return (body as { all?: unknown }).all === true
}
