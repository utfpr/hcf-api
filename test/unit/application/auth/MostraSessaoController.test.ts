import {
  describe, expect, test, vi
} from 'vitest'

import { MostraSessaoController } from '@/application/auth/MostraSessaoController'
import { UserNotFoundError } from '@/domain/auth/error/UserNotFoundError'
import { type MostraSessaoUseCase } from '@/domain/auth/MostraSessaoUseCase'
import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { AccessTokenExpiredError } from '@/library/auth/error/AccessTokenExpiredError'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { Either } from '@/library/either/Either'
import { StatusCode } from '@/library/http/common'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

import { httpRequest } from './httpRequest'

describe('MostraSessaoController', () => {
  test('returns 200 with user and rules', async () => {
    const mostraSessaoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right({
        user: {
          id: 1,
          nome: 'Ana',
          email: 'ana@utfpr.edu.br',
          tipo_usuario_id: 1
        },
        rules: []
      }))
    } as unknown as MostraSessaoUseCase
    const controller = new MostraSessaoController({ mostraSessaoUseCase })

    const response = await controller.handle(httpRequest({
      headers: { Authorization: 'Bearer jwt' } as never
    }), vi.fn())

    expect('statusCode' in response && response.statusCode).toBe(StatusCode.Ok)
    expect('body' in response ? response.body : undefined).toEqual({
      user: {
        id: 1,
        nome: 'Ana',
        email: 'ana@utfpr.edu.br',
        tipo_usuario_id: 1
      },
      rules: []
    })
  })

  test('puts the domain error name in report', async () => {
    const expired = await new MostraSessaoController({
      mostraSessaoUseCase: {
        execute: vi.fn().mockResolvedValue(Either.left(new AccessTokenExpiredError()))
      } as unknown as MostraSessaoUseCase
    }).handle(httpRequest({
      headers: { Authorization: 'Bearer jwt' } as never
    }), vi.fn())

    expect(expired).toBeInstanceOf(UnauthorizedError)
    expect((expired as UnauthorizedError).name).toBe('UnauthorizedError')
    expect((expired as UnauthorizedError).report).toEqual({ name: 'AccessTokenExpiredError' })

    const invalid = await new MostraSessaoController({
      mostraSessaoUseCase: {
        execute: vi.fn().mockResolvedValue(Either.left(new AccessTokenInvalidError()))
      } as unknown as MostraSessaoUseCase
    }).handle(httpRequest({
      headers: { Authorization: 'Bearer jwt' } as never
    }), vi.fn())

    expect((invalid as UnauthorizedError).report).toEqual({ name: 'AccessTokenInvalidError' })

    const revoked = await new MostraSessaoController({
      mostraSessaoUseCase: {
        execute: vi.fn().mockResolvedValue(Either.left(new UserSessionNotFoundError()))
      } as unknown as MostraSessaoUseCase
    }).handle(httpRequest({
      headers: { Authorization: 'Bearer jwt' } as never
    }), vi.fn())

    expect((revoked as UnauthorizedError).report).toEqual({ name: 'UserSessionNotFoundError' })

    const missingUser = await new MostraSessaoController({
      mostraSessaoUseCase: {
        execute: vi.fn().mockResolvedValue(Either.left(new UserNotFoundError()))
      } as unknown as MostraSessaoUseCase
    }).handle(httpRequest({
      headers: { Authorization: 'Bearer jwt' } as never
    }), vi.fn())

    expect((missingUser as UnauthorizedError).report).toEqual({ name: 'UserNotFoundError' })
  })
})
