import jwt from 'jsonwebtoken'
import {
  afterEach,
  describe,
  expect,
  test,
  vi
} from 'vitest'

import { JwtAccessToken } from '@/infrastructure/auth/JwtAccessToken'
import { AccessTokenExpiredError } from '@/library/auth/error/AccessTokenExpiredError'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'

const SECRET = 'test-secret-for-access-tokens'

describe('JwtAccessToken', () => {
  const accessToken = new JwtAccessToken({ secret: SECRET })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('round-trips access claims', () => {
    const signed = accessToken.sign({
      sub: 7,
      sid: 'session-1'
    })

    expect(signed.right()).toBe(true)
    if (!signed.right()) return

    const result = accessToken.verify(signed.value)

    expect(result.right()).toBe(true)
    if (!result.right()) return

    expect(result.value).toMatchObject({
      sub: 7,
      sid: 'session-1',
      typ: 'access'
    })
    expect(result.value).not.toHaveProperty('role')
    expect(typeof result.value.iat).toBe('number')
    expect(typeof result.value.exp).toBe('number')
  })

  test('rejects an expired access token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const signed = accessToken.sign({
      sub: 1,
      sid: 'session-expired'
    })
    expect(signed.right()).toBe(true)
    if (!signed.right()) return

    vi.setSystemTime(new Date('2026-01-01T00:16:00.000Z'))

    const result = accessToken.verify(signed.value)
    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(AccessTokenExpiredError)
  })

  test('rejects a garbage token', () => {
    const result = accessToken.verify('not-a-jwt')

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(AccessTokenInvalidError)
  })

  test('rejects a token whose typ is not access', () => {
    const token = jwt.sign(
      {
        sub: '1',
        sid: 'session-2',
        typ: 'refresh'
      },
      SECRET,
      { expiresIn: '15m' }
    )

    const result = accessToken.verify(token)
    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(AccessTokenInvalidError)
  })

  test('rejects a token signed with another algorithm', () => {
    const token = jwt.sign(
      {
        sub: '1',
        sid: 'session-3',
        typ: 'access'
      },
      SECRET,
      {
        algorithm: 'HS384',
        expiresIn: '15m'
      }
    )

    const result = accessToken.verify(token)
    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(AccessTokenInvalidError)
  })
})
