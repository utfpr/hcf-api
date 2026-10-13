import { RateLimiterMemory } from 'rate-limiter-flexible'
import {
  describe, expect, test, vi
} from 'vitest'

import { RateLimitMiddleware } from '@/application/RateLimitMiddleware'
import { Method, StatusCode } from '@/library/http/common'
import type { Headers } from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { TooManyRequestsError } from '@/library/http/error/TooManyRequestsError'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

const headers = {} as Headers

describe('RateLimitMiddleware', () => {
  test('counts only 401 responses and returns 429 after five failures', async () => {
    const limiter = new RateLimiterMemory({
      points: 5,
      duration: 15 * 60
    })
    const middleware = new RateLimitMiddleware({
      limiter,
      isFailure: response => response instanceof HttpError && response.statusCode === 401
    })

    const request = {
      method: Method.Post,
      path: '/auth/login',
      headers: { 'x-forwarded-for': '203.0.113.10' } as unknown as Headers,
      cookies: {},
      params: {},
      body: {}
    }

    const unauthorized = new UnauthorizedError({ message: 'Credenciais inválidas' })
    const fail = () => Promise.resolve(unauthorized)

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await middleware.handle(request, fail)
      expect(response).toBe(unauthorized)
    }

    const blocked = await middleware.handle(request, fail)
    expect(blocked).toBeInstanceOf(TooManyRequestsError)
    expect(blocked instanceof HttpError && blocked.statusCode).toBe(StatusCode.TooManyRequests)
  })

  test('does not consume points on success', async () => {
    const limiter = new RateLimiterMemory({
      points: 1,
      duration: 15 * 60
    })
    const middleware = new RateLimitMiddleware({
      limiter,
      isFailure: response => response instanceof HttpError && response.statusCode === 401
    })

    const request = {
      method: Method.Post,
      path: '/auth/login',
      headers,
      cookies: {},
      params: {},
      body: {}
    }

    const ok = { statusCode: StatusCode.Ok, body: { ok: true } }
    const succeed = () => Promise.resolve(ok)
    await middleware.handle(request, succeed)
    const second = await middleware.handle(request, vi.fn(succeed))
    expect(second).toEqual(ok)
  })
})
