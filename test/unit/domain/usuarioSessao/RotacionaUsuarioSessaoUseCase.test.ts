import {
  describe, expect, test
} from 'vitest'

import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { RotacionaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/RotacionaUsuarioSessaoUseCase'
import { UsuarioSessao } from '@/domain/usuarioSessao/UsuarioSessao'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

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

describe('RotacionaUsuarioSessaoUseCase', () => {
  test('updates hash, lastUsedAt, and expiresAt on the same id', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    const existing = makeSession({
      refreshTokenHash: CURRENT_HASH,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      lastUsedAt: new Date('2026-08-01T00:00:00.000Z'),
      expiresAt: new Date('2026-10-01T00:00:00.000Z')
    })
    await collection.create(existing)

    const useCase = new RotacionaUsuarioSessaoUseCase({
      usuarioSessaoCollection: collection,
      refreshToken: makeRefreshToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshToken: CURRENT_TOKEN })

    expect(result.right()).toBe(true)
    if (!result.right()) return

    expect(result.value.refreshToken).toBe(NEW_TOKEN)
    expect(result.value.session.id).toBe(existing.id)
    expect(result.value.session.refreshTokenHash).toBe(NEW_HASH)
    expect(result.value.session.lastUsedAt).toEqual(NOW)
    expect(result.value.session.expiresAt).toEqual(UsuarioSessao.refreshExpiresAt(NOW))
    expect(collection.rows.get(existing.id)?.refreshTokenHash).toBe(NEW_HASH)
  })

  test('returns not found when the refresh hash is unknown', async () => {
    const useCase = new RotacionaUsuarioSessaoUseCase({
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      refreshToken: makeRefreshToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshToken: 'missing' })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
  })

  test('deletes an expired session and returns not found', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    const existing = makeSession({
      refreshTokenHash: CURRENT_HASH,
      expiresAt: new Date('2026-09-27T11:00:00.000Z')
    })
    await collection.create(existing)

    const useCase = new RotacionaUsuarioSessaoUseCase({
      usuarioSessaoCollection: collection,
      refreshToken: makeRefreshToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshToken: CURRENT_TOKEN })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
    expect(collection.rows.has(existing.id)).toBe(false)
  })
})
