import {
  describe, expect, test
} from 'vitest'

import { CredenciaisInvalidasError } from '@/domain/usuario/error/CredenciaisInvalidasError'
import { CriaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/CriaUsuarioSessaoUseCase'
import { EntraSessaoUseCase } from '@/domain/usuarioSessao/EntraSessaoUseCase'
import { type AccessToken } from '@/library/auth/AccessToken'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { FakeUsuarioCollection } from '../usuario/FakeUsuarioCollection'
import { FakeUsuarioSessaoCollection } from './FakeUsuarioSessaoCollection'

const HASH = 'b'.repeat(64)

function makeRefreshToken(): RefreshToken {
  return {
    generate: () => Either.right({
      token: 'opaque-refresh',
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

describe('EntraSessaoUseCase', () => {
  test('creates a session and signs access without a role claim', async () => {
    const usuarioCollection = new FakeUsuarioCollection()
    usuarioCollection.add({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2,
      senha: 'hash'
    })

    const useCase = new EntraSessaoUseCase({
      usuarioCollection,
      criaUsuarioSessaoUseCase: new CriaUsuarioSessaoUseCase({
        usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
        refreshToken: makeRefreshToken()
      }),
      accessToken: makeAccessToken(),
      comparaSenha: (texto, hash) => texto === 'secret' && hash === 'hash'
    })

    const result = await useCase.execute({
      email: 'ana@example.test',
      senha: 'secret'
    })

    expect(result.right()).toBe(true)
    if (!result.right()) {
      return
    }

    expect(result.value.refreshToken).toBe('opaque-refresh')
    expect(result.value.user).toEqual({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2
    })
    expect(result.value.accessToken.startsWith('access.7.')).toBe(true)
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

    const useCase = new EntraSessaoUseCase({
      usuarioCollection,
      criaUsuarioSessaoUseCase: new CriaUsuarioSessaoUseCase({
        usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
        refreshToken: makeRefreshToken()
      }),
      accessToken: makeAccessToken(),
      comparaSenha: () => false
    })

    const result = await useCase.execute({
      email: 'ana@example.test',
      senha: 'wrong'
    })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(CredenciaisInvalidasError)
  })
})
