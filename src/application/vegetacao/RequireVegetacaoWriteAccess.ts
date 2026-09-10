import jwt from 'jsonwebtoken'

import {
  HttpRequest,
  HttpResponse
} from '@/library/http/common'
import { ForbiddenError } from '@/library/http/error/ForbiddenError'
import { HttpError } from '@/library/http/error/HttpError'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

const ALLOWED_TIPOS_USUARIOS = new Set([1, 2])

export class RequireVegetacaoWriteAccess implements RequestHandler {
  async handle(request: HttpRequest, next: NextHandler): Promise<HttpResponse | HttpError> {
    const authorization = request.headers.Authorization ?? request.headers.authorization

    if (!authorization || typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      return new ForbiddenError({ message: 'Token de autenticação obrigatório' })
    }

    const token = authorization.slice('Bearer '.length).trim()
    if (!token) {
      return new ForbiddenError({ message: 'Token de autenticação obrigatório' })
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'test-secret') as { tipo_usuario_id?: unknown }
      const tipoUsuarioId = Number(payload.tipo_usuario_id)

      if (!Number.isInteger(tipoUsuarioId) || !ALLOWED_TIPOS_USUARIOS.has(tipoUsuarioId)) {
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
