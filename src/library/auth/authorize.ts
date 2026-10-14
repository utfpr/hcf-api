import jwt from 'jsonwebtoken'

import { secret } from '@/config/security'
import { HttpRequest, HttpResponse } from '@/library/http/common'
import { ForbiddenError } from '@/library/http/error/ForbiddenError'
import { HttpError } from '@/library/http/error/HttpError'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

import {
  Action,
  Resource
} from './createRules'

function parseBearerToken(request: HttpRequest): string | undefined {
  const authorization = request.headers.Authorization ?? request.headers.authorization

  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return undefined
  }

  const token = authorization.slice('Bearer '.length).trim()
  return token.length > 0 ? token : undefined
}

export function authorize(action: Action, resource: Resource): RequestHandler {
  return {
    async handle(request: HttpRequest, next: NextHandler): Promise<HttpResponse | HttpError> {
      const token = parseBearerToken(request)

      if (!token) {
        return new ForbiddenError({ message: 'Token de autenticação obrigatório' })
      }

      try {
        if (!secret) {
          return new UnauthorizedError({ message: 'Token de autenticação inválido' })
        }

        const payload = jwt.verify(token, secret) as {
          id?: unknown
          tipo_usuario_id?: unknown
        }
        const user = {
          id: Number(payload.id ?? 0),
          tipo_usuario_id: Number(payload.tipo_usuario_id ?? 0)
        }

        const isAllowedToWrite = [1, 2].includes(user.tipo_usuario_id)
        if (!isAllowedToWrite) {
          return new ForbiddenError({ message: 'Usuário sem permissão para alterar vegetações' })
        }

        return next()
      } catch (error) {
        if (error instanceof Error && error.name === 'TokenExpiredError') {
          return new UnauthorizedError({ message: 'Token expirado' })
        }

        return new UnauthorizedError({ message: 'Token de autenticação inválido' })
      }
    }
  }
}
