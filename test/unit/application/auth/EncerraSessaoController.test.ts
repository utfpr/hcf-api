import {
  describe, expect, test, vi
} from 'vitest'

import { EncerraSessaoController } from '@/application/auth/EncerraSessaoController'
import { type ConfirmaSessaoAcessoUseCase } from '@/domain/auth/ConfirmaSessaoAcessoUseCase'
import { type EncerraSessaoUseCase } from '@/domain/auth/EncerraSessaoUseCase'
import { type BuscaUsuarioSessaoPorHashUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorHashUseCase'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'
import { StatusCode } from '@/library/http/common'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

import { httpRequest } from './httpRequest'

const accessPayload = {
  sub: 9,
  sid: '11111111-1111-4111-8111-111111111111',
  typ: 'access' as const,
  role: 1,
  iat: 1,
  exp: 2
}

describe('EncerraSessaoController', () => {
  test('returns 204 and clears the cookie after logout', async () => {
    const controller = new EncerraSessaoController({
      encerraSessaoUseCase: {
        execute: vi.fn().mockResolvedValue(Either.right(undefined))
      } as unknown as EncerraSessaoUseCase,
      confirmaSessaoAcessoUseCase: {
        execute: vi.fn().mockResolvedValue(Either.right(accessPayload))
      } as unknown as ConfirmaSessaoAcessoUseCase,
      buscaUsuarioSessaoPorHashUseCase: {
        execute: vi.fn()
      } as unknown as BuscaUsuarioSessaoPorHashUseCase,
      refreshToken: {
        generate: () => Either.right({
          token: 't',
          hash: 'h'
        }),
        hash: () => Either.right('hashed')
      } satisfies RefreshToken
    })

    const response = await controller.handle(httpRequest({
      headers: { Authorization: 'Bearer access' } as never
    }), vi.fn())

    expect('statusCode' in response && response.statusCode).toBe(StatusCode.NoContent)
    expect('headers' in response ? response.headers?.['Set-Cookie'] : undefined).toContain(
      'Max-Age=0'
    )
  })

  test('requires a valid access token for all: true', async () => {
    const encerraSessaoUseCase = {
      execute: vi.fn()
    } as unknown as EncerraSessaoUseCase
    const controller = new EncerraSessaoController({
      encerraSessaoUseCase,
      confirmaSessaoAcessoUseCase: {
        execute: vi.fn()
      } as unknown as ConfirmaSessaoAcessoUseCase,
      buscaUsuarioSessaoPorHashUseCase: {
        execute: vi.fn()
      } as unknown as BuscaUsuarioSessaoPorHashUseCase,
      refreshToken: {
        generate: () => Either.right({
          token: 't',
          hash: 'h'
        }),
        hash: () => Either.right('hashed')
      } satisfies RefreshToken
    })

    const response = await controller.handle(httpRequest({
      body: {
        all: true,
        refresh_token: 'opaque'
      }
    }), vi.fn())

    expect(response).toBeInstanceOf(UnauthorizedError)
    expect(encerraSessaoUseCase.execute).not.toHaveBeenCalled()
  })

  test('logs out the current session from access only', async () => {
    const encerraSessaoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(undefined))
    } as unknown as EncerraSessaoUseCase
    const confirmaSessaoAcessoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(accessPayload))
    } as unknown as ConfirmaSessaoAcessoUseCase

    const controller = new EncerraSessaoController({
      encerraSessaoUseCase,
      confirmaSessaoAcessoUseCase,
      buscaUsuarioSessaoPorHashUseCase: {
        execute: vi.fn()
      } as unknown as BuscaUsuarioSessaoPorHashUseCase,
      refreshToken: {
        generate: () => Either.right({
          token: 't',
          hash: 'h'
        }),
        hash: () => Either.right('hashed')
      } satisfies RefreshToken
    })

    await controller.handle(httpRequest({
      headers: { Authorization: 'Bearer access' } as never
    }), vi.fn())

    expect(encerraSessaoUseCase.execute).toHaveBeenCalledWith({
      all: false,
      sessaoId: accessPayload.sid
    })
  })
})
