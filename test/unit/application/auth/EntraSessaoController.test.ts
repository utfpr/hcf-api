import {
  describe, expect, test, vi
} from 'vitest'

import { EntraSessaoController } from '@/application/auth/EntraSessaoController'
import { type EntraSessaoUseCase } from '@/domain/auth/EntraSessaoUseCase'
import { InvalidCredentialsError } from '@/domain/auth/error/InvalidCredentialsError'
import { Either } from '@/library/either/Either'
import { StatusCode } from '@/library/http/common'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

import { httpRequest } from './httpRequest'

const sessao = {
  accessToken: 'jwt',
  refreshToken: 'opaque',
  expiresIn: 900,
  user: {
    id: 1,
    nome: 'Ana',
    email: 'ana@utfpr.edu.br',
    tipo_usuario_id: 1
  },
  rules: []
}

describe('EntraSessaoController', () => {
  test('returns 200, tokens, and Set-Cookie on success', async () => {
    const entraSessaoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(sessao))
    } as unknown as EntraSessaoUseCase
    const controller = new EntraSessaoController({ entraSessaoUseCase })

    const response = await controller.handle(httpRequest({
      body: {
        email: 'ana@utfpr.edu.br',
        senha: 'secret'
      }
    }), vi.fn())

    expect(entraSessaoUseCase.execute).toHaveBeenCalledWith({
      email: 'ana@utfpr.edu.br',
      senha: 'secret'
    })
    expect('statusCode' in response && response.statusCode).toBe(StatusCode.Ok)
    expect('headers' in response ? response.headers?.['Set-Cookie'] : undefined).toContain(
      'refresh_token=opaque'
    )
    expect('body' in response ? response.body : undefined).toMatchObject({
      access_token: 'jwt',
      refresh_token: 'opaque',
      token_type: 'Bearer',
      expires_in: 900,
      user: sessao.user,
      rules: []
    })
  })

  test('returns 401 for invalid credentials', async () => {
    const entraSessaoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.left(new InvalidCredentialsError()))
    } as unknown as EntraSessaoUseCase
    const controller = new EntraSessaoController({ entraSessaoUseCase })

    const response = await controller.handle(httpRequest({
      body: {
        email: 'ana@utfpr.edu.br',
        senha: 'wrong'
      }
    }), vi.fn())

    expect(response).toBeInstanceOf(UnauthorizedError)
    expect((response as UnauthorizedError).name).toBe('UnauthorizedError')
    expect((response as UnauthorizedError).report).toEqual({ name: 'InvalidCredentialsError' })
    expect((response as UnauthorizedError).message).toBe('As credenciais enviadas são inválidas')
  })
})
