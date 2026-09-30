import {
  describe, expect, test, vi
} from 'vitest'

import ForbiddenException from '@/errors/forbidden-exception'
import UnauthorizedException from '@/errors/unauthorized-exception'
import { type AccessToken } from '@/library/auth/AccessToken'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { Either } from '@/library/either/Either'
import { createExpressAuthorize } from '@/middlewares/authorize-middleware'

import { FakeUsuarioCollection } from '../domain/usuario/FakeUsuarioCollection'
import { FakeUsuarioSessaoCollection } from '../domain/usuarioSessao/FakeUsuarioSessaoCollection'

function makeAccessToken(): AccessToken {
  return {
    sign: params => Either.right(`access.${params.sub}.${params.sid}`),
    verify: () => Either.left(new AccessTokenInvalidError())
  }
}

describe('createExpressAuthorize', () => {
  test('accepts a 2-day JWT via legacy fallback', async () => {
    const authorize = createExpressAuthorize({
      accessToken: makeAccessToken(),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      legacyFallback: true,
      verifyLegacyUser: () => ({
        id: 9,
        nome: 'Legacy',
        email: 'legacy@test',
        tipo_usuario_id: 1
      })
    })
    const middleware = authorize('read', 'Pais')
    const request = {
      method: 'GET',
      path: '/tombos',
      headers: { authorization: 'Bearer two-day' },
      params: {},
      query: {},
      body: {}
    }
    const next = vi.fn()

    await middleware(request as never, {} as never, next)

    expect(next).toHaveBeenCalledWith()
    expect(request).toMatchObject({
      user: { id: 9 },
      usuario: { id: 9 }
    })
  })

  test('maps missing token on a protected pair to 401', async () => {
    const authorize = createExpressAuthorize({
      accessToken: makeAccessToken(),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection()
    })
    const middleware = authorize('read', 'UsuarioSessao')
    const next = vi.fn()

    await middleware({
      method: 'GET',
      path: '/me',
      headers: {},
      params: {},
      query: {},
      body: {}
    } as never, {} as never, next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException))
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 401 })
    expect(next.mock.calls[0]?.[0]).not.toMatchObject({ errorCode: 101 })
  })

  test('maps deny to ForbiddenException 102', async () => {
    const authorize = createExpressAuthorize({
      accessToken: makeAccessToken(),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      legacyFallback: true,
      verifyLegacyUser: () => ({
        id: 9,
        nome: 'Legacy',
        email: 'legacy@test',
        tipo_usuario_id: 1
      })
    })
    const next = vi.fn()

    await authorize('create', 'Tombo')({
      method: 'POST',
      path: '/tombos',
      headers: { authorization: 'Bearer two-day' },
      params: {},
      query: {},
      body: {}
    } as never, {} as never, next)

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenException))
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 403, errorCode: 102 })
  })
})
