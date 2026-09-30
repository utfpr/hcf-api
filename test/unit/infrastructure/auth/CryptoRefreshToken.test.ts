import { createHash } from 'node:crypto'
import {
  describe,
  expect,
  test
} from 'vitest'

import { CryptoRefreshToken } from '@/infrastructure/auth/CryptoRefreshToken'

describe('CryptoRefreshToken', () => {
  const refreshToken = new CryptoRefreshToken()

  test('generated hash matches hash()', () => {
    const generated = refreshToken.generate()

    expect(generated.right()).toBe(true)
    if (!generated.right()) return

    const hashed = refreshToken.hash(generated.value.token)
    expect(hashed.right()).toBe(true)
    if (!hashed.right()) return

    expect(generated.value.hash).toBe(hashed.value)
    expect(Buffer.from(generated.value.token, 'base64url')).toHaveLength(32)
  })

  test('two generated tokens differ', () => {
    const first = refreshToken.generate()
    const second = refreshToken.generate()

    expect(first.right()).toBe(true)
    expect(second.right()).toBe(true)
    if (!first.right() || !second.right()) return

    expect(first.value.token).not.toBe(second.value.token)
    expect(first.value.hash).not.toBe(second.value.hash)
  })

  test('hash is hex SHA-256', () => {
    const token = 'opaque-refresh-token'
    const hashed = refreshToken.hash(token)

    expect(hashed.right()).toBe(true)
    if (!hashed.right()) return

    expect(hashed.value).toHaveLength(64)
    expect(hashed.value).toBe(createHash('sha256').update(token, 'utf8').digest('hex'))
    expect(hashed.value).toMatch(/^[0-9a-f]{64}$/)
  })
})
