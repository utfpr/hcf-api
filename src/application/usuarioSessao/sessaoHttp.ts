import { type Attributes } from '@/domain/usuario/Usuario'
import { createRules } from '@/library/auth/createRules'
import { type HttpRequest } from '@/library/http/common'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

import { REFRESH_COOKIE_NAME } from './refreshCookie'

export const ACCESS_EXPIRES_IN_SECONDS = 900

export interface SessaoUsuario {
  id: number
  nome: string
  email: string
  tipo_usuario_id: number
}

export function credenciaisInvalidas(): UnauthorizedError {
  return new UnauthorizedError({ message: 'Credenciais inválidas' })
}

export function notAuthorized(): UnauthorizedError {
  return new UnauthorizedError({ message: 'Unauthorized' })
}

export function toSessaoUsuario(user: Attributes): SessaoUsuario {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo_usuario_id: user.tipoUsuarioId
  }
}

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

export function readRefreshFromBody(body: unknown): string | undefined {
  if (body === null || typeof body !== 'object') {
    return undefined
  }

  const record = body as { refresh_token?: unknown; refreshToken?: unknown }
  const token = record.refresh_token ?? record.refreshToken
  return typeof token === 'string' && token.length > 0 ? token : undefined
}

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

export function hasCsrfHeader(request: HttpRequest): boolean {
  const value = request.headers['x-requested-with']
  return typeof value === 'string' && value.trim().length > 0
}

export function looksLikeBrowserRequest(request: HttpRequest): boolean {
  const origin = request.headers.origin
  const referer = request.headers.referer
  return (typeof origin === 'string' && origin.length > 0)
    || (typeof referer === 'string' && referer.length > 0)
}

export function readBearerAccess(request: HttpRequest): string | undefined {
  const value = request.headers.authorization ?? request.headers.Authorization
  if (typeof value !== 'string') {
    return undefined
  }

  const match = /^Bearer\s+(\S+)$/i.exec(value.trim())
  return match?.[1]
}

export function logoutAllRequested(body: unknown): boolean {
  if (body === null || typeof body !== 'object') {
    return false
  }

  return (body as { all?: unknown }).all === true
}
