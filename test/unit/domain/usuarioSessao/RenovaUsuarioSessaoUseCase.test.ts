import {
  describe, expect, test
} from 'vitest'

import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { RenovaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/RenovaUsuarioSessaoUseCase'
import { UsuarioSessao } from '@/domain/usuarioSessao/UsuarioSessao'
import { type AccessToken } from '@/library/auth/AccessToken'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { FakeUsuarioCollection } from '../usuario/FakeUsuarioCollection'
import {
  FakeUsuarioSessaoCollection,
  makeSession
} from './FakeUsuarioSessaoCollection'

const CURRENT_TOKEN = 'current-refresh'
const CURRENT_HASH = 'c'.repeat(64)
const NEW_TOKEN = 'new-refresh'
const NEW_HASH = 'd'.repeat(64)
const NOW = new Date('2026-09-27T12:00:00.000Z')

function makeRefreshToken(): RefreshToken {
  return {
    generate: () => Either.right({
      token: NEW_TOKEN,
      hash: NEW_HASH
    }),
    hash: token => {
      if (token === CURRENT_TOKEN) {
        return Either.right(CURRENT_HASH)
      }
      return Either.right('unknown'.padEnd(64, '0'))
    }
  }
}

function makeAccessToken(): AccessToken {
  return {
    sign: params => Either.right(`access.${params.sub}.${params.sid}`),
    verify: () => Either.left(new AccessTokenInvalidError())
  }
}

describe('RenovaUsuarioSessaoUseCase', () => {
  test('rotates the same session and signs a new access token', async () => {
    const sessaoCollection = new FakeUsuarioSessaoCollection()
    const existing = makeSession({
      usuarioId: 7,
      refreshTokenHash: CURRENT_HASH,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      lastUsedAt: new Date('2026-08-01T00:00:00.000Z'),
      expiresAt: new Date('2026-10-01T00:00:00.000Z')
    })
    await sessaoCollection.create(existing)

    const usuarioCollection = new FakeUsuarioCollection()
    usuarioCollection.add({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2,
      senha: 'hash'
    })

    const useCase = new RenovaUsuarioSessaoUseCase({
      usuarioCollection,
      usuarioSessaoCollection: sessaoCollection,
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshToken: CURRENT_TOKEN })

    expect(result.right()).toBe(true)
    if (!result.right()) return

    expect(result.value.refreshToken).toBe(NEW_TOKEN)
    expect(result.value.accessToken).toBe(`access.7.${existing.id}`)
    expect(result.value.user).toEqual({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2
    })
    expect(sessaoCollection.rows.get(existing.id)?.refreshTokenHash).toBe(NEW_HASH)
    expect(sessaoCollection.rows.get(existing.id)?.lastUsedAt).toEqual(NOW)
    expect(sessaoCollection.rows.get(existing.id)?.expiresAt).toEqual(
      UsuarioSessao.refreshExpiresAt(NOW)
    )
  })

  test('returns not found when the refresh hash is unknown', async () => {
    const useCase = new RenovaUsuarioSessaoUseCase({
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshToken: 'missing' })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
  })

  test('deletes an expired session and returns not found', async () => {
    const sessaoCollection = new FakeUsuarioSessaoCollection()
    const existing = makeSession({
      refreshTokenHash: CURRENT_HASH,
      expiresAt: new Date('2026-09-27T11:00:00.000Z')
    })
    await sessaoCollection.create(existing)

    const useCase = new RenovaUsuarioSessaoUseCase({
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: sessaoCollection,
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshToken: CURRENT_TOKEN })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
    expect(sessaoCollection.rows.has(existing.id)).toBe(false)
  })

  test('deletes the session when the user no longer exists', async () => {
    const sessaoCollection = new FakeUsuarioSessaoCollection()
    const existing = makeSession({
      usuarioId: 7,
      refreshTokenHash: CURRENT_HASH,
      expiresAt: new Date('2026-10-01T00:00:00.000Z')
    })
    await sessaoCollection.create(existing)

    const useCase = new RenovaUsuarioSessaoUseCase({
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: sessaoCollection,
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshToken: CURRENT_TOKEN })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
    expect(sessaoCollection.rows.has(existing.id)).toBe(false)
  })
})
