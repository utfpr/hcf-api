import {
  afterEach, describe, expect, test
} from 'vitest'

import {
  REFRESH_COOKIE_NAME,
  serializeClearedRefreshCookie,
  serializeRefreshCookie
} from '@/application/usuarioSessao/refreshCookie'

describe('refreshCookie', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'test'
  })

  test('serializes HttpOnly SameSite=Lax Path=/api/auth without Secure outside production', () => {
    process.env.NODE_ENV = 'development'
    const cookie = serializeRefreshCookie('secret/value')

    expect(cookie).toContain(`${REFRESH_COOKIE_NAME}=secret%2Fvalue`)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/api/auth')
    expect(cookie).not.toContain('Secure')
    expect(cookie).not.toContain('SameSite=None')
  })

  test('adds SameSite=None and Secure in production', () => {
    process.env.NODE_ENV = 'production'
    const cookie = serializeRefreshCookie('token')
    expect(cookie).toContain('SameSite=None')
    expect(cookie).toContain('Secure')
  })

  test('clears the cookie with Max-Age=0', () => {
    const cookie = serializeClearedRefreshCookie()
    expect(cookie).toContain(`${REFRESH_COOKIE_NAME}=`)
    expect(cookie).toContain('Max-Age=0')
    expect(cookie).toContain('Path=/api/auth')
  })
})
