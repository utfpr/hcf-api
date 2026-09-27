import {
  describe, expect, test, vi
} from 'vitest'

import { RateLimitMiddleware } from '@/application/auth/RateLimitMiddleware'
import { StatusCode } from '@/library/http/common'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

import { httpRequest } from './httpRequest'

describe('RateLimitMiddleware', () => {
  test('calls next when under the limit', async () => {
    const handler = new RateLimitMiddleware()
    const next = vi.fn().mockResolvedValue({
      statusCode: StatusCode.Ok,
      body: { ok: true }
    })

    const response = await handler.handle(httpRequest({
      path: '/auth/login',
      headers: { 'x-forwarded-for': '203.0.113.10' } as never
    }), next)

    expect(next).toHaveBeenCalledOnce()
    expect('statusCode' in response && response.statusCode).toBe(StatusCode.Ok)
  })

  test('returns 429 after five failed attempts from the same address', async () => {
    const handler = new RateLimitMiddleware()
    const failed = new UnauthorizedError({ message: 'no' })
    const next = vi.fn().mockResolvedValue(failed)
    const request = httpRequest({
      path: '/auth/login',
      headers: { 'x-forwarded-for': '203.0.113.20' } as never
    })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await handler.handle(request, next)
      expect(response).toBe(failed)
    }

    const limited = await handler.handle(request, next)

    expect(next).toHaveBeenCalledTimes(5)
    expect('statusCode' in limited && limited.statusCode).toBe(StatusCode.TooManyRequests)
    expect('body' in limited ? limited.body : undefined).toEqual({
      error: {
        code: 429,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
      }
    })
  })

  test('does not count successful logins', async () => {
    const handler = new RateLimitMiddleware()
    const next = vi.fn().mockResolvedValue({
      statusCode: StatusCode.Ok,
      body: { ok: true }
    })
    const request = httpRequest({
      path: '/auth/login',
      headers: { 'x-forwarded-for': '203.0.113.30' } as never
    })

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await handler.handle(request, next)
      expect('statusCode' in response && response.statusCode).toBe(StatusCode.Ok)
    }

    expect(next).toHaveBeenCalledTimes(8)
  })
})
