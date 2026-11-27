import { UsuarioSessao } from '@/domain/usuarioSessao/UsuarioSessao'

export const REFRESH_COOKIE_NAME = 'refresh_token'
const REFRESH_COOKIE_PATH = '/api/auth'
const MAX_AGE_SECONDS = UsuarioSessao.REFRESH_TTL_DAYS * 24 * 60 * 60

function cookieFlags(): string {
  // Em produção utiliza SameSite=None e Secure para permitir envio cross-origin com credentials: true;
  // Em desenvolvimento utiliza SameSite=Lax para viabilizar testes sem HTTPS (ex.: Postman e localhost)
  if (process.env.NODE_ENV === 'production') {
    return `Path=${REFRESH_COOKIE_PATH}; HttpOnly; SameSite=None; Secure`
  }
  return `Path=${REFRESH_COOKIE_PATH}; HttpOnly; SameSite=Lax`
}

/**
 * Serializa a instrução 'Set-Cookie' para emissão do cookie HTTP-only do refresh token com expiração de 30 dias.
 *
 * @param token String do refresh token a ser armazenada.
 * @returns Cabeçalho Set-Cookie formatado.
 */
export function serializeRefreshCookie(token: string): string {
  return `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${MAX_AGE_SECONDS}; ${cookieFlags()}`
}

/**
 * Serializa a instrução 'Set-Cookie' para expirar e limpar o cookie do refresh token no navegador (Max-Age=0).
 *
 * @returns Cabeçalho Set-Cookie formatado para invalidação imediata.
 */
export function serializeClearedRefreshCookie(): string {
  return `${REFRESH_COOKIE_NAME}=; Max-Age=0; ${cookieFlags()}`
}
