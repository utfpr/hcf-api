import {
  describe, expect, test
} from 'vitest'

import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { MostraUsuarioSessaoUseCase } from '@/domain/usuarioSessao/MostraUsuarioSessaoUseCase'
import { type AccessToken } from '@/library/auth/AccessToken'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { Either } from '@/library/either/Either'

import { FakeUsuarioCollection } from '../usuario/FakeUsuarioCollection'
import {
  FakeUsuarioSessaoCollection,
  makeSession
} from './FakeUsuarioSessaoCollection'

const NOW = new Date('2026-09-27T12:00:00.000Z')
const SESSION_ID = '11111111-1111-4111-8111-111111111111'

function makeAccessToken(): AccessToken {
  return {
    sign: params => Either.right(`access.${params.sub}.${params.sid}`),
    verify: token => {
      if (token !== 'valid-access') {
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

describe('MostraUsuarioSessaoUseCase', () => {
  test('returns the user when the access token and session are valid', async () => {
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

    const useCase = new MostraUsuarioSessaoUseCase({
      accessToken: makeAccessToken(),
      usuarioCollection,
      usuarioSessaoCollection: sessaoCollection,
      now: () => NOW
    })

    const result = await useCase.execute({ accessToken: 'valid-access' })

    expect(result.right()).toBe(true)
    expect(result.value).toEqual({
      id: 7,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2
    })
  })

  test('returns not found when the access token is invalid', async () => {
    const useCase = new MostraUsuarioSessaoUseCase({
      accessToken: makeAccessToken(),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      now: () => NOW
    })

    const result = await useCase.execute({ accessToken: 'bad' })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
  })

  test('returns not found when the session is missing', async () => {
    const useCase = new MostraUsuarioSessaoUseCase({
      accessToken: makeAccessToken(),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      now: () => NOW
    })

    const result = await useCase.execute({ accessToken: 'valid-access' })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
  })

  test('deletes an expired session and returns not found', async () => {
    const sessaoCollection = new FakeUsuarioSessaoCollection()
    await sessaoCollection.create(makeSession({
      id: SESSION_ID,
      usuarioId: 7,
      expiresAt: new Date('2026-09-27T11:59:59.000Z')
    }))

    const useCase = new MostraUsuarioSessaoUseCase({
      accessToken: makeAccessToken(),
      usuarioCollection: new FakeUsuarioCollection(),
      usuarioSessaoCollection: sessaoCollection,
      now: () => NOW
    })

    const result = await useCase.execute({ accessToken: 'valid-access' })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
    expect(sessaoCollection.rows.has(SESSION_ID)).toBe(false)
  })
})
