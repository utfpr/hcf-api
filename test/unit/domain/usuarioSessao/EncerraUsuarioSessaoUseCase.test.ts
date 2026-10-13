import {
  describe, expect, test
} from 'vitest'

import { EncerraUsuarioSessaoUseCase } from '@/domain/usuarioSessao/EncerraUsuarioSessaoUseCase'
import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { type AccessToken } from '@/library/auth/AccessToken'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import {
  FakeUsuarioSessaoCollection,
  makeSession
} from './FakeUsuarioSessaoCollection'

const REFRESH = 'current-refresh'
const HASH = 'c'.repeat(64)
const SESSION_ID = '11111111-1111-4111-8111-111111111111'
const NOW = new Date('2026-09-27T12:00:00.000Z')

function makeRefreshToken(): RefreshToken {
  return {
    generate: () => Either.right({
      token: 'unused',
      hash: 'd'.repeat(64)
    }),
    hash: token => {
      if (token === REFRESH) {
        return Either.right(HASH)
      }
      return Either.right('0'.repeat(64))
    }
  }
}

function makeAccessToken(): AccessToken {
  return {
    sign: params => Either.right(`access.${params.sub}.${params.sid}`),
    verify: token => {
      if (token !== 'valid-access') {
        return Either.left(new AccessTokenInvalidError())
      }

      return Either.right({
        sub: 3,
        sid: SESSION_ID,
        typ: 'access' as const,
        iat: 0,
        exp: 1
      })
    }
  }
}

describe('EncerraUsuarioSessaoUseCase', () => {
  test('deletes the session by refresh token', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    await collection.create(makeSession({
      id: SESSION_ID,
      usuarioId: 3,
      refreshTokenHash: HASH,
      expiresAt: new Date('2026-10-01T00:00:00.000Z')
    }))

    const useCase = new EncerraUsuarioSessaoUseCase({
      usuarioSessaoCollection: collection,
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshToken: REFRESH })

    expect(result.right()).toBe(true)
    expect(collection.rows.has(SESSION_ID)).toBe(false)
  })

  test('succeeds when the refresh token is already unknown', async () => {
    const useCase = new EncerraUsuarioSessaoUseCase({
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshToken: REFRESH })

    expect(result.right()).toBe(true)
  })

  test('deletes an expired session found by refresh hash', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    await collection.create(makeSession({
      id: SESSION_ID,
      refreshTokenHash: HASH,
      expiresAt: new Date('2026-09-27T11:59:59.000Z')
    }))

    const useCase = new EncerraUsuarioSessaoUseCase({
      usuarioSessaoCollection: collection,
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshToken: REFRESH })

    expect(result.right()).toBe(true)
    expect(collection.rows.has(SESSION_ID)).toBe(false)
  })

  test('deletes the session by access token sid', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    await collection.create(makeSession({
      id: SESSION_ID,
      usuarioId: 3
    }))

    const useCase = new EncerraUsuarioSessaoUseCase({
      usuarioSessaoCollection: collection,
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ accessToken: 'valid-access' })

    expect(result.right()).toBe(true)
    expect(collection.rows.has(SESSION_ID)).toBe(false)
  })

  test('returns not found when access-only logout has an invalid token', async () => {
    const useCase = new EncerraUsuarioSessaoUseCase({
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ accessToken: 'bad' })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
  })

  test('deletes every session for the user when all is requested', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    await collection.create(makeSession({
      id: SESSION_ID,
      usuarioId: 3
    }))
    await collection.create(makeSession({
      id: '22222222-2222-4222-8222-222222222222',
      usuarioId: 3,
      refreshTokenHash: 'e'.repeat(64)
    }))
    await collection.create(makeSession({
      id: '33333333-3333-4333-8333-333333333333',
      usuarioId: 9,
      refreshTokenHash: 'f'.repeat(64)
    }))

    const useCase = new EncerraUsuarioSessaoUseCase({
      usuarioSessaoCollection: collection,
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({
      accessToken: 'valid-access',
      all: true
    })

    expect(result.right()).toBe(true)
    expect(collection.rows.size).toBe(1)
    expect(collection.rows.has('33333333-3333-4333-8333-333333333333')).toBe(true)
  })

  test('returns not found when logout-all has no valid access token', async () => {
    const useCase = new EncerraUsuarioSessaoUseCase({
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ all: true })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
  })
})
