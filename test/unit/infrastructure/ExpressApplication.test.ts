import {
  describe, expect, test, vi
} from 'vitest'

import {
  applySetCookie,
  cookiesFromExpress,
  writeExpressResponse
} from '@/infrastructure/ExpressApplication'
import { StatusCode } from '@/library/http/common'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'
import { type Logger } from '@/library/logger/Logger'

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

describe('ExpressApplication cookie plumbing', () => {
  test('cookiesFromExpress copies string cookies', () => {
    expect(cookiesFromExpress({
      cookies: {
        refresh_token: 'opaque',
        other: 1
      }
    } as never)).toEqual({ refresh_token: 'opaque' })
  })

  test('applySetCookie appends one or many cookies', () => {
    const append = vi.fn()
    applySetCookie({ append } as never, { 'Set-Cookie': 'a=1' })
    applySetCookie({ append } as never, { 'Set-Cookie': ['b=2', 'c=3'] })

    expect(append).toHaveBeenCalledWith('Set-Cookie', 'a=1')
    expect(append).toHaveBeenCalledWith('Set-Cookie', 'b=2')
    expect(append).toHaveBeenCalledWith('Set-Cookie', 'c=3')
  })

  test('writeExpressResponse sets cookies on success and error', () => {
    const success = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn(),
      append: vi.fn()
    }
    writeExpressResponse(success as never, {
      statusCode: StatusCode.Ok,
      headers: { 'Set-Cookie': 'refresh_token=opaque; Path=/auth' },
      body: { ok: true }
    }, logger)

    expect(success.append).toHaveBeenCalledWith(
      'Set-Cookie',
      'refresh_token=opaque; Path=/auth'
    )
    expect(success.status).toHaveBeenCalledWith(200)
    expect(success.json).toHaveBeenCalledWith({ ok: true })

    const errorResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn(),
      append: vi.fn()
    }
    writeExpressResponse(
      errorResponse as never,
      new UnauthorizedError({
        message: 'no',
        headers: { 'Set-Cookie': 'refresh_token=; Max-Age=0; Path=/auth' }
      }),
      logger
    )

    expect(errorResponse.append).toHaveBeenCalledWith(
      'Set-Cookie',
      'refresh_token=; Max-Age=0; Path=/auth'
    )
    expect(errorResponse.status).toHaveBeenCalledWith(401)
  })

  test('writeExpressResponse ends a 204 without a JSON body', () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn(),
      append: vi.fn()
    }
    writeExpressResponse(res as never, {
      statusCode: StatusCode.NoContent,
      headers: { 'Set-Cookie': 'refresh_token=; Max-Age=0; Path=/auth' }
    }, logger)

    expect(res.status).toHaveBeenCalledWith(204)
    expect(res.end).toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
