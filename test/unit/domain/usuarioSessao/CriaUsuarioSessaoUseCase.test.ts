import {
  describe, expect, test
} from 'vitest'

import { InvalidCredentialsError } from '@/domain/usuario/error/InvalidCredentialsError'
import { CriaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/CriaUsuarioSessaoUseCase'
import { UsuarioSessao } from '@/domain/usuarioSessao/UsuarioSessao'
import { type AccessToken } from '@/library/auth/AccessToken'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { RefreshTokenError } from '@/library/auth/error/RefreshTokenError'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { FakeUsuarioCollection } from '../usuario/FakeUsuarioCollection'
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

function makeAccessToken(): AccessToken {
  return {
    sign: params => Either.right(`access.${params.sub}.${params.sid}`),
    verify: () => Either.left(new AccessTokenInvalidError())
  }
}

describe('CriaUsuarioSessaoUseCase', () => {
  test('creates a session, signs access, and returns the user without a role claim', async () => {
    const usuarioCollection = new FakeUsuarioCollection()
    usuarioCollection.add({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2,
      senha: 'hash'
    })
    const sessaoCollection = new FakeUsuarioSessaoCollection()

    const useCase = new CriaUsuarioSessaoUseCase({
      usuarioCollection,
      usuarioSessaoCollection: sessaoCollection,
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      comparaSenha: (texto, hash) => texto === 'secret' && hash === 'hash',
      now: () => NOW
    })

    const result = await useCase.execute({
      email: 'ana@example.test',
      senha: 'secret'
    })

    expect(result.right()).toBe(true)
    if (!result.right()) {
      return
    }

    expect(result.value.refreshToken).toBe(TOKEN)
    expect(result.value.user).toEqual({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2
    })
    expect(result.value.accessToken.startsWith('access.7.')).toBe(true)

    const sid = result.value.accessToken.split('.')[2]
    const stored = sessaoCollection.rows.get(sid)
    expect(stored?.usuarioId).toBe(7)
    expect(stored?.refreshTokenHash).toBe(HASH)
    expect(stored?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(stored?.createdAt).toEqual(NOW)
    expect(stored?.lastUsedAt).toEqual(NOW)
    expect(stored?.expiresAt).toEqual(UsuarioSessao.refreshExpiresAt(NOW))
  })

  test('rejects unknown email or bad password', async () => {
    const usuarioCollection = new FakeUsuarioCollection()
    usuarioCollection.add({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2,
      senha: 'hash'
    })

    const useCase = new CriaUsuarioSessaoUseCase({
      usuarioCollection,
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      refreshToken: makeRefreshToken(),
      accessToken: makeAccessToken(),
      comparaSenha: () => false
    })

    const result = await useCase.execute({
      email: 'ana@example.test',
      senha: 'wrong'
    })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCredentialsError)
  })

  test('propagates refresh generate failure', async () => {
    const usuarioCollection = new FakeUsuarioCollection()
    usuarioCollection.add({
      id: 1,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2,
      senha: 'hash'
    })
    const error = new RefreshTokenError({ message: 'generate failed' })
    const useCase = new CriaUsuarioSessaoUseCase({
      usuarioCollection,
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      refreshToken: {
        generate: () => Either.left(error),
        hash: () => Either.right(HASH)
      },
      accessToken: makeAccessToken(),
      comparaSenha: () => true,
      now: () => NOW
    })

    const result = await useCase.execute({
      email: 'ana@example.test',
      senha: 'secret'
    })

    expect(result.left()).toBe(true)
    expect(result.value).toBe(error)
  })
})
