const COOKIE_NAME = 'refresh_token'
const COOKIE_PATH = '/auth'
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60
const COOKIE_FLAGS = 'HttpOnly; Secure; SameSite=None'

export function refreshCookieHeader(value: string): string {
  return `${COOKIE_NAME}=${value}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=${COOKIE_PATH}; ${COOKIE_FLAGS}`
}

export function clearRefreshCookieHeader(): string {
  return `${COOKIE_NAME}=; Max-Age=0; Path=${COOKIE_PATH}; ${COOKIE_FLAGS}`
}
