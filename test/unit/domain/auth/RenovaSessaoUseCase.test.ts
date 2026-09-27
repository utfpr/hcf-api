import {
  describe, expect, test
} from 'vitest'

import { UserNotFoundError } from '@/domain/auth/error/UserNotFoundError'
import { RenovaSessaoUseCase } from '@/domain/auth/RenovaSessaoUseCase'
import { ApagaUsuarioSessoesUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessoesUseCase'
import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { RotacionaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/RotacionaUsuarioSessaoUseCase'
import { type AccessToken } from '@/library/auth/AccessToken'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { FakeUsuarioSessaoCollection } from '../usuarioSessao/FakeUsuarioSessaoCollection'
import { FakeUsuarioCollection } from './FakeUsuarioCollection'

const HASH = 'c'.repeat(64)
const NEW_HASH = 'd'.repeat(64)
const SESSION_ID = '11111111-1111-4111-8111-111111111111'
const USER = {
  id: 4,
  nome: 'Bia',
  email: 'bia@utfpr.edu.br',
  tipoUsuarioId: 2,
  senhaHash: 'x'
}

function sessionRow(hash = HASH) {
  const createdAt = new Date('2026-09-01T00:00:00.000Z')
  return {
    id: SESSION_ID,
    usuarioId: USER.id,
    refreshTokenHash: hash,
    createdAt,
    lastUsedAt: createdAt,
    expiresAt: new Date('2026-12-01T00:00:00.000Z')
  }
}

describe('RenovaSessaoUseCase', () => {
  test('rotates the session and signs a new access token', async () => {
    const sessoes = new FakeUsuarioSessaoCollection()
    sessoes.rows.set(SESSION_ID, sessionRow())
    const usuarios = new FakeUsuarioCollection()
    usuarios.add(USER)

    const refreshToken: RefreshToken = {
      generate: () => Either.right({
        token: 'new-refresh',
        hash: NEW_HASH
      }),
      hash: () => Either.right(HASH)
    }
    const accessToken: AccessToken = {
      sign: params => Either.right(`jwt-${params.sid}`),
      verify: () => Either.left(new Error('unused') as never)
    }

    const useCase = new RenovaSessaoUseCase({
      rotacionaUsuarioSessaoUseCase: new RotacionaUsuarioSessaoUseCase({
        usuarioSessaoCollection: sessoes,
        refreshToken
      }),
      apagaUsuarioSessoesUseCase: new ApagaUsuarioSessoesUseCase({
        usuarioSessaoCollection: sessoes
      }),
      usuarioCollection: usuarios,
      accessToken
    })

    const result = await useCase.execute({ refreshToken: 'old-refresh' })

    expect(result.right()).toBe(true)
    if (!result.right()) return
    expect(result.value.accessToken).toBe(`jwt-${SESSION_ID}`)
    expect(result.value.refreshToken).toBe('new-refresh')
    expect(result.value.user.email).toBe(USER.email)
    expect(sessoes.rows.get(SESSION_ID)?.refreshTokenHash).toBe(NEW_HASH)
  })

  test('returns not found for an unknown refresh', async () => {
    const sessoes = new FakeUsuarioSessaoCollection()
    const useCase = new RenovaSessaoUseCase({
      rotacionaUsuarioSessaoUseCase: new RotacionaUsuarioSessaoUseCase({
        usuarioSessaoCollection: sessoes,
        refreshToken: {
          generate: () => Either.right({
            token: 'x',
            hash: NEW_HASH
          }),
          hash: () => Either.right(HASH)
        }
      }),
      apagaUsuarioSessoesUseCase: new ApagaUsuarioSessoesUseCase({
        usuarioSessaoCollection: sessoes
      }),
      usuarioCollection: new FakeUsuarioCollection(),
      accessToken: {
        sign: () => Either.right('jwt'),
        verify: () => Either.left(new Error('unused') as never)
      }
    })

    const result = await useCase.execute({ refreshToken: 'missing' })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
  })

  test('deletes sessions and returns UserNotFoundError when the user is gone after rotate', async () => {
    const sessoes = new FakeUsuarioSessaoCollection()
    sessoes.rows.set(SESSION_ID, sessionRow())

    const useCase = new RenovaSessaoUseCase({
      rotacionaUsuarioSessaoUseCase: new RotacionaUsuarioSessaoUseCase({
        usuarioSessaoCollection: sessoes,
        refreshToken: {
          generate: () => Either.right({
            token: 'new-refresh',
            hash: NEW_HASH
          }),
          hash: () => Either.right(HASH)
        }
      }),
      apagaUsuarioSessoesUseCase: new ApagaUsuarioSessoesUseCase({
        usuarioSessaoCollection: sessoes
      }),
      usuarioCollection: new FakeUsuarioCollection(),
      accessToken: {
        sign: () => Either.right('jwt'),
        verify: () => Either.left(new Error('unused') as never)
      }
    })

    const result = await useCase.execute({ refreshToken: 'old-refresh' })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
    expect(sessoes.rows.size).toBe(0)
  })
})
