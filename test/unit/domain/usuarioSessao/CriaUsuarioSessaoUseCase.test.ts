import {
  describe, expect, test
} from 'vitest'

import { CriaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/CriaUsuarioSessaoUseCase'
import { UsuarioSessao } from '@/domain/usuarioSessao/UsuarioSessao'
import { RefreshTokenError } from '@/library/auth/error/RefreshTokenError'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { FakeUsuarioSessaoCollection } from './FakeUsuarioSessaoCollection'

const HASH = 'b'.repeat(64)
const TOKEN = 'opaque-refresh'
const NOW = new Date('2026-09-27T12:00:00.000Z')

function makeRefreshToken(): RefreshToken {
  return {
    generate: () => Either.right({
      token: TOKEN,
      hash: HASH
    }),
    hash: token => Either.right(`${token}-hashed`)
  }
}

describe('CriaUsuarioSessaoUseCase', () => {
  test('creates a session with generated id, hash, and 30-day expiry', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    const useCase = new CriaUsuarioSessaoUseCase({
      usuarioSessaoCollection: collection,
      refreshToken: makeRefreshToken(),
      now: () => NOW
    })

    const result = await useCase.execute({ usuarioId: 7 })

    expect(result.right()).toBe(true)
    if (!result.right()) return

    expect(result.value.refreshToken).toBe(TOKEN)
    expect(result.value.session.usuarioId).toBe(7)
    expect(result.value.session.refreshTokenHash).toBe(HASH)
    expect(result.value.session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(result.value.session.createdAt).toEqual(NOW)
    expect(result.value.session.lastUsedAt).toEqual(NOW)
    expect(result.value.session.expiresAt).toEqual(UsuarioSessao.refreshExpiresAt(NOW))
    expect(collection.rows.get(result.value.session.id)?.refreshTokenHash).toBe(HASH)
  })

  test('propagates refresh generate failure', async () => {
    const error = new RefreshTokenError({ message: 'generate failed' })
    const useCase = new CriaUsuarioSessaoUseCase({
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      refreshToken: {
        generate: () => Either.left(error),
        hash: () => Either.right(HASH)
      },
      now: () => NOW
    })

    const result = await useCase.execute({ usuarioId: 1 })

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
  })
})
