import {
  describe, expect, test
} from 'vitest'

import { AuthorizeMiddleware } from '@/application/AuthorizeMiddleware'
import { type AccessToken } from '@/library/auth/AccessToken'
import { AccessTokenExpiredError } from '@/library/auth/error/AccessTokenExpiredError'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { Either } from '@/library/either/Either'
import {
  type HttpRequest, Method, StatusCode
} from '@/library/http/common'
import type { Headers } from '@/library/http/common'
import { ForbiddenError } from '@/library/http/error/ForbiddenError'
import { HttpError } from '@/library/http/error/HttpError'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

import { FakeUsuarioCollection } from '../domain/usuario/FakeUsuarioCollection'
import {
  FakeUsuarioSessaoCollection,
  makeSession
} from '../domain/usuarioSessao/FakeUsuarioSessaoCollection'

const SESSION_ID = '11111111-1111-4111-8111-111111111111'
const NOW = new Date('2026-09-27T12:00:00.000Z')
const headers = {} as Headers

function requestWithBearer(token?: string): HttpRequest {
  return {
    method: Method.Get,
    path: '/v1/paises',
    headers: token
      ? { Authorization: `Bearer ${token}` } as unknown as Headers
      : headers,
    cookies: {},
    params: {},
    body: {}
  }
}

function makeAccessToken(params: {
  token?: string
  expired?: boolean
  invalid?: boolean
} = {}): AccessToken {
  return {
    sign: sign => Either.right(`access.${sign.sub}.${sign.sid}`),
    verify: token => {
      if (params.expired) {
        return Either.left(new AccessTokenExpiredError())
      }
      if (params.invalid || token !== (params.token ?? 'valid-access')) {
        return Either.left(new AccessTokenInvalidError())
      }

      return Either.right({
        sub: 7,
        sid: SESSION_ID,
        typ: 'access' as const,
        iat: 0,
        exp: 1
      })
    }
  }
}

describe('AuthorizeMiddleware', () => {
  test('attaches Guest when there is no token and Guest can the pair', async () => {
    const middleware = new AuthorizeMiddleware({
      action: 'read',
      resource: 'Pais',
      accessToken: makeAccessToken(),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection()
    })
    const request = requestWithBearer()
    const ok = { statusCode: StatusCode.Ok, body: [] }
    const response = await middleware.handle(request, () => Promise.resolve(ok))

    expect(response).toEqual(ok)
    expect(request.user).toBeUndefined()
    expect(request.auth?.can('read', 'Pais')).toBe(true)
  })

  test('returns unauthorized when Guest cannot the pair', async () => {
    const middleware = new AuthorizeMiddleware({
      action: 'read',
      resource: 'UsuarioSessao',
      accessToken: makeAccessToken(),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection()
    })

    const response = await middleware.handle(requestWithBearer(), () => Promise.resolve({
      statusCode: StatusCode.Ok
    }))

    expect(response).toBeInstanceOf(UnauthorizedError)
    expect(response instanceof HttpError && response.type).toBe('unauthorized')
  })

  test('returns access_expired when the session JWT is expired', async () => {
    const middleware = new AuthorizeMiddleware({
      action: 'read',
      resource: 'Pais',
      accessToken: makeAccessToken({ expired: true }),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection()
    })

    const response = await middleware.handle(requestWithBearer('expired'), () => Promise.resolve({
      statusCode: StatusCode.Ok
    }))

    expect(response).toBeInstanceOf(UnauthorizedError)
    expect(response instanceof HttpError && response.type).toBe('access_expired')
  })

  test('does not use the 2-day fallback on the new stack', async () => {
    const middleware = new AuthorizeMiddleware({
      action: 'read',
      resource: 'Pais',
      accessToken: makeAccessToken({ invalid: true }),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      verifyLegacyUser: () => ({
        id: 1, nome: 'Legacy', email: 'l@test', tipo_usuario_id: 1
      })
    })

    const response = await middleware.handle(requestWithBearer('legacy'), () => Promise.resolve({
      statusCode: StatusCode.Ok
    }))

    expect(response).toBeInstanceOf(UnauthorizedError)
    expect(response instanceof HttpError && response.type).toBe('unauthorized')
  })

  test('authorizes a session user and attaches rules from createRules', async () => {
    const sessaoCollection = new FakeUsuarioSessaoCollection()
    await sessaoCollection.create(makeSession({
      id: SESSION_ID,
      usuarioId: 7,
      expiresAt: new Date('2026-10-01T00:00:00.000Z')
    }))
    const usuarioCollection = new FakeUsuarioCollection()
    usuarioCollection.add({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2,
      senha: 'hash'
    })

    const middleware = new AuthorizeMiddleware({
      action: 'read',
      resource: 'UsuarioSessao',
      accessToken: makeAccessToken(),
      usuarioCollection,
      usuarioSessaoCollection: sessaoCollection,
      now: () => NOW
    })
    const request = requestWithBearer('valid-access')
    const ok = { statusCode: StatusCode.Ok, body: { ok: true } }
    const response = await middleware.handle(request, () => Promise.resolve(ok))

    expect(response).toEqual(ok)
    expect(request.user).toEqual({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipo_usuario_id: 2
    })
    expect(request.auth?.can('read', 'UsuarioSessao')).toBe(true)
  })

  test('returns forbidden when the user cannot the pair', async () => {
    const sessaoCollection = new FakeUsuarioSessaoCollection()
    await sessaoCollection.create(makeSession({
      id: SESSION_ID,
      usuarioId: 7,
      expiresAt: new Date('2026-10-01T00:00:00.000Z')
    }))
    const usuarioCollection = new FakeUsuarioCollection()
    usuarioCollection.add({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2,
      senha: 'hash'
    })

    const middleware = new AuthorizeMiddleware({
      action: 'create',
      resource: 'Tombo',
      accessToken: makeAccessToken(),
      usuarioCollection,
      usuarioSessaoCollection: sessaoCollection,
      now: () => NOW
    })

    const response = await middleware.handle(requestWithBearer('valid-access'), () => Promise.resolve({
      statusCode: StatusCode.Ok
    }))

    expect(response).toBeInstanceOf(ForbiddenError)
    expect(response instanceof HttpError && response.type).toBe('forbidden')
  })

  test('falls back to the 2-day JWT when legacyFallback is on', async () => {
    const middleware = new AuthorizeMiddleware({
      action: 'read',
      resource: 'Pais',
      accessToken: makeAccessToken({ invalid: true }),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      legacyFallback: true,
      verifyLegacyUser: () => ({
        id: 4, nome: 'Curador', email: 'c@test', tipo_usuario_id: 1
      })
    })
    const request = requestWithBearer('two-day')
    const ok = { statusCode: StatusCode.Ok }
    const response = await middleware.handle(request, () => Promise.resolve(ok))

    expect(response).toEqual(ok)
    expect(request.user?.id).toBe(4)
  })
})
