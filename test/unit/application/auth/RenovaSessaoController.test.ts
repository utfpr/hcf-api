import {
  describe, expect, test, vi
} from 'vitest'

import { RenovaSessaoController } from '@/application/auth/RenovaSessaoController'
import { type RenovaSessaoUseCase } from '@/domain/auth/RenovaSessaoUseCase'
import { Either } from '@/library/either/Either'
import { StatusCode } from '@/library/http/common'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

import { httpRequest } from './httpRequest'

const sessao = {
  accessToken: 'jwt',
  refreshToken: 'new-opaque',
  expiresIn: 900,
  user: {
    id: 1,
    nome: 'Ana',
    email: 'ana@utfpr.edu.br',
    tipo_usuario_id: 1
  },
  rules: []
}

describe('RenovaSessaoController', () => {
  test('uses the body refresh when both body and cookie are present', async () => {
    const renovaSessaoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(sessao))
    } as unknown as RenovaSessaoUseCase
    const controller = new RenovaSessaoController({ renovaSessaoUseCase })

    const response = await controller.handle(httpRequest({
      body: { refresh_token: 'from-body' },
      cookies: { refresh_token: 'from-cookie' }
    }), vi.fn())

    expect(renovaSessaoUseCase.execute).toHaveBeenCalledWith({ refreshToken: 'from-body' })
    expect('statusCode' in response && response.statusCode).toBe(StatusCode.Ok)
  })

  test('accepts a cookie refresh when the CSRF header is present', async () => {
    const renovaSessaoUseCase = {
      execute: vi.fn().mockResolvedValue(Either.right(sessao))
    } as unknown as RenovaSessaoUseCase
    const controller = new RenovaSessaoController({ renovaSessaoUseCase })

    await controller.handle(httpRequest({
      cookies: { refresh_token: 'from-cookie' },
      headers: { 'x-requested-with': 'XMLHttpRequest' } as never
    }), vi.fn())

    expect(renovaSessaoUseCase.execute).toHaveBeenCalledWith({ refreshToken: 'from-cookie' })
  })

  test('rejects a cookie refresh without the CSRF header', async () => {
    const renovaSessaoUseCase = {
      execute: vi.fn()
    } as unknown as RenovaSessaoUseCase
    const controller = new RenovaSessaoController({ renovaSessaoUseCase })

    const response = await controller.handle(httpRequest({
      cookies: { refresh_token: 'from-cookie' }
    }), vi.fn())

    expect(renovaSessaoUseCase.execute).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(UnauthorizedError)
    expect((response as UnauthorizedError).name).toBe('UnauthorizedError')
    expect((response as UnauthorizedError).headers?.['Set-Cookie']).toContain('Max-Age=0')
  })

  test('rejects a missing refresh token', async () => {
    const renovaSessaoUseCase = {
      execute: vi.fn()
    } as unknown as RenovaSessaoUseCase
    const controller = new RenovaSessaoController({ renovaSessaoUseCase })

    const response = await controller.handle(httpRequest(), vi.fn())

    expect(response).toBeInstanceOf(UnauthorizedError)
    expect(renovaSessaoUseCase.execute).not.toHaveBeenCalled()
  })
})
