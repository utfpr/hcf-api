import {
  describe, expect, test
} from 'vitest'

import { EntraSessaoUseCase } from '@/domain/auth/EntraSessaoUseCase'
import { InvalidCredentialsError } from '@/domain/auth/error/InvalidCredentialsError'
import { CriaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/CriaUsuarioSessaoUseCase'
import { type AccessToken } from '@/library/auth/AccessToken'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { FakeUsuarioSessaoCollection } from '../usuarioSessao/FakeUsuarioSessaoCollection'
import { FakeUsuarioCollection } from './FakeUsuarioCollection'

const HASH = 'b'.repeat(64)
const REFRESH = 'opaque-refresh'
const USER = {
  id: 7,
  nome: 'Ana',
  email: 'ana@utfpr.edu.br',
  tipoUsuarioId: 1,
  senhaHash: 'hashed'
}

function makeRefreshToken(): RefreshToken {
  return {
    generate: () => Either.right({
      token: REFRESH,
      hash: HASH
    }),
    hash: token => Either.right(`${token}-hashed`)
  }
}

function makeAccessToken(): AccessToken {
  return {
    sign: () => Either.right('access.jwt'),
    verify: () => Either.left(new Error('unused') as never)
  }
}

describe('EntraSessaoUseCase', () => {
  test('creates a session and returns tokens, user, and createRules output', async () => {
    const usuarios = new FakeUsuarioCollection()
    usuarios.add(USER)
    const useCase = new EntraSessaoUseCase({
      usuarioCollection: usuarios,
      criaUsuarioSessaoUseCase: new CriaUsuarioSessaoUseCase({
        usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
        refreshToken: makeRefreshToken()
      }),
      accessToken: makeAccessToken(),
      comparaSenha: (senha, hash) => senha === 'secret' && hash === USER.senhaHash
    })

    const result = await useCase.execute({
      email: USER.email,
      senha: 'secret'
    })

    expect(result.right()).toBe(true)
    if (!result.right()) return

    expect(result.value.accessToken).toBe('access.jwt')
    expect(result.value.refreshToken).toBe(REFRESH)
    expect(result.value.expiresIn).toBe(900)
    expect(result.value.user).toEqual({
      id: 7,
      nome: 'Ana',
      email: 'ana@utfpr.edu.br',
      tipo_usuario_id: 1
    })
    expect(result.value.user).not.toHaveProperty('senhaHash')
    expect(result.value.rules).toEqual([])
  })

  test('rejects unknown email with the same credentials error', async () => {
    const useCase = new EntraSessaoUseCase({
      usuarioCollection: new FakeUsuarioCollection(),
      criaUsuarioSessaoUseCase: new CriaUsuarioSessaoUseCase({
        usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
        refreshToken: makeRefreshToken()
      }),
      accessToken: makeAccessToken(),
      comparaSenha: () => true
    })

    const result = await useCase.execute({
      email: 'missing@utfpr.edu.br',
      senha: 'secret'
    })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCredentialsError)
  })

  test('rejects a wrong password with the same credentials error', async () => {
    const usuarios = new FakeUsuarioCollection()
    usuarios.add(USER)
    const useCase = new EntraSessaoUseCase({
      usuarioCollection: usuarios,
      criaUsuarioSessaoUseCase: new CriaUsuarioSessaoUseCase({
        usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
        refreshToken: makeRefreshToken()
      }),
      accessToken: makeAccessToken(),
      comparaSenha: () => false
    })

    const result = await useCase.execute({
      email: USER.email,
      senha: 'wrong'
    })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCredentialsError)
  })
})
