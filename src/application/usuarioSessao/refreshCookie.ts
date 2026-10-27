import { UsuarioSessao } from '@/domain/usuarioSessao/UsuarioSessao'

export const REFRESH_COOKIE_NAME = 'refresh_token'
const REFRESH_COOKIE_PATH = '/api/auth'
const MAX_AGE_SECONDS = UsuarioSessao.REFRESH_TTL_DAYS * 24 * 60 * 60

function cookieFlags(): string {
  // SameSite=None requires Secure; Postman on http://localhost will not send Secure cookies.
  if (process.env.NODE_ENV === 'production') {
    return `Path=${REFRESH_COOKIE_PATH}; HttpOnly; SameSite=None; Secure`
  }
  return `Path=${REFRESH_COOKIE_PATH}; HttpOnly; SameSite=Lax`
}

export function serializeRefreshCookie(token: string): string {
  return `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${MAX_AGE_SECONDS}; ${cookieFlags()}`
}

export function serializeClearedRefreshCookie(): string {
  return `${REFRESH_COOKIE_NAME}=; Max-Age=0; ${cookieFlags()}`
}
