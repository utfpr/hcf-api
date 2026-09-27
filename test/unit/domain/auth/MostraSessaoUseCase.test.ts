import {
  describe, expect, test
} from 'vitest'

import { ConfirmaSessaoAcessoUseCase } from '@/domain/auth/ConfirmaSessaoAcessoUseCase'
import { UserNotFoundError } from '@/domain/auth/error/UserNotFoundError'
import { MostraSessaoUseCase } from '@/domain/auth/MostraSessaoUseCase'
import { BuscaUsuarioSessaoPorIdUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorIdUseCase'
import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { type AccessPayload, type AccessToken } from '@/library/auth/AccessToken'
import { AccessTokenExpiredError } from '@/library/auth/error/AccessTokenExpiredError'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { Either } from '@/library/either/Either'

import {
  FakeUsuarioSessaoCollection,
  makeSession
} from '../usuarioSessao/FakeUsuarioSessaoCollection'
import { FakeUsuarioCollection } from './FakeUsuarioCollection'

const SID = '11111111-1111-4111-8111-111111111111'
const USER = {
  id: 10,
  nome: 'Cida',
  email: 'cida@utfpr.edu.br',
  tipoUsuarioId: 1,
  senhaHash: 'h'
}

const payload: AccessPayload = {
  sub: 10,
  sid: SID,
  typ: 'access',
  role: 1,
  iat: 1,
  exp: 2
}

function makeUseCase(params: {
  accessToken: AccessToken
  sessoes?: FakeUsuarioSessaoCollection
  usuarios?: FakeUsuarioCollection
}) {
  const sessoes = params.sessoes ?? new FakeUsuarioSessaoCollection()
  const usuarios = params.usuarios ?? new FakeUsuarioCollection()
  return new MostraSessaoUseCase({
    confirmaSessaoAcessoUseCase: new ConfirmaSessaoAcessoUseCase({
      accessToken: params.accessToken,
      buscaUsuarioSessaoPorIdUseCase: new BuscaUsuarioSessaoPorIdUseCase({
        usuarioSessaoCollection: sessoes
      })
    }),
    usuarioCollection: usuarios
  })
}

describe('MostraSessaoUseCase', () => {
  test('returns user and rules when access and session are valid', async () => {
    const sessoes = new FakeUsuarioSessaoCollection()
    await sessoes.create(makeSession({
      id: SID,
      usuarioId: USER.id,
      expiresAt: new Date('2027-01-01T00:00:00.000Z')
    }))
    const usuarios = new FakeUsuarioCollection()
    usuarios.add(USER)

    const result = await makeUseCase({
      accessToken: {
        sign: () => Either.right('jwt'),
        verify: () => Either.right(payload)
      },
      sessoes,
      usuarios
    }).execute({ accessToken: 'jwt' })

    expect(result.right()).toBe(true)
    if (!result.right()) return
    expect(result.value.user).toEqual({
      id: 10,
      nome: 'Cida',
      email: 'cida@utfpr.edu.br',
      tipo_usuario_id: 1
    })
    expect(result.value.rules).toEqual([])
  })

  test('propagates expired and invalid access errors', async () => {
    const expired = await makeUseCase({
      accessToken: {
        sign: () => Either.right('jwt'),
        verify: () => Either.left(new AccessTokenExpiredError())
      }
    }).execute({ accessToken: 'expired' })

    expect(expired.value).toBeInstanceOf(AccessTokenExpiredError)

    const invalid = await makeUseCase({
      accessToken: {
        sign: () => Either.right('jwt'),
        verify: () => Either.left(new AccessTokenInvalidError())
      }
    }).execute({ accessToken: 'bad' })

    expect(invalid.value).toBeInstanceOf(AccessTokenInvalidError)
  })

  test('returns not found when the session row is missing', async () => {
    const result = await makeUseCase({
      accessToken: {
        sign: () => Either.right('jwt'),
        verify: () => Either.right(payload)
      }
    }).execute({ accessToken: 'jwt' })

    expect(result.value).toBeInstanceOf(UserSessionNotFoundError)
  })

  test('returns UserNotFoundError when the user row is missing', async () => {
    const sessoes = new FakeUsuarioSessaoCollection()
    await sessoes.create(makeSession({
      id: SID,
      usuarioId: USER.id,
      expiresAt: new Date('2027-01-01T00:00:00.000Z')
    }))

    const result = await makeUseCase({
      accessToken: {
        sign: () => Either.right('jwt'),
        verify: () => Either.right(payload)
      },
      sessoes
    }).execute({ accessToken: 'jwt' })

    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })
})
