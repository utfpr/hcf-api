import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { UsuarioSessao } from '@/domain/usuarioSessao/UsuarioSessao'
import { type UsuarioSessaoCollection } from '@/domain/usuarioSessao/UsuarioSessaoCollection'
import { type AccessToken } from '@/library/auth/AccessToken'
import {
  type Action, createRules, GUEST_USER, type Resource
} from '@/library/auth/createRules'
import { AccessTokenExpiredError } from '@/library/auth/error/AccessTokenExpiredError'
import { Manager } from '@/library/auth/Manager'
import {
  type HttpRequest, type HttpResponse, type RequestUser
} from '@/library/http/common'
import { ForbiddenError } from '@/library/http/error/ForbiddenError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { readBearerAccess } from './usuarioSessao/sessaoHttp'

interface Dependencies {
  action: Action
  resource: Resource
  accessToken: AccessToken
  usuarioCollection: UsuarioCollection
  usuarioSessaoCollection: UsuarioSessaoCollection
  legacyFallback?: boolean
  now?: () => Date
  verifyLegacyUser?: (token: string) => RequestUser | null | Promise<RequestUser | null>
}

export class AuthorizeMiddleware implements RequestHandler {
  private readonly action: Action
  private readonly resource: Resource
  private readonly accessToken: AccessToken
  private readonly usuarioCollection: UsuarioCollection
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection
  private readonly legacyFallback: boolean
  private readonly now: () => Date
  private readonly verifyLegacyUser?: Dependencies['verifyLegacyUser']

  constructor(dependencies: Dependencies) {
    this.action = dependencies.action
    this.resource = dependencies.resource
    this.accessToken = dependencies.accessToken
    this.usuarioCollection = dependencies.usuarioCollection
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
    this.legacyFallback = dependencies.legacyFallback ?? false
    this.now = dependencies.now ?? (() => new Date())
    this.verifyLegacyUser = dependencies.verifyLegacyUser
  }

  async handle(request: HttpRequest, next: NextHandler): Promise<HttpResponse | HttpError> {
    const token = readBearerAccess(request)
    if (!token) {
      return this.continueAsGuestOrUnauthorized(request, next)
    }

    const identity = await this.resolveBearerIdentity(token)
    if (identity instanceof HttpError) {
      return identity
    }

    return this.attachAndAuthorize(request, identity, next)
  }

  private continueAsGuestOrUnauthorized(
    request: HttpRequest,
    next: NextHandler
  ): Promise<HttpResponse | HttpError> {
    const guest: RequestUser = { ...GUEST_USER }
    const auth = new Manager({ rules: createRules(guest) })
    if (!auth.can(this.action, this.resource)) {
      return Promise.resolve(unauthorized())
    }

    request.user = guest
    request.auth = auth
    return next()
  }

  private async resolveBearerIdentity(token: string): Promise<RequestUser | HttpError> {
    const verified = this.accessToken.verify(token)
    if (verified.left()) {
      if (verified.value instanceof AccessTokenExpiredError) {
        return new UnauthorizedError({
          message: 'Access token expired',
          type: 'access_expired',
          cause: verified.value
        })
      }

      if (this.legacyFallback && this.verifyLegacyUser) {
        try {
          const legacy = await this.verifyLegacyUser(token)
          if (legacy) {
            return legacy
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'TokenExpiredError') {
            return unauthorized({ cause: error })
          }
          return unauthorized({ cause: error })
        }
      }

      return unauthorized({ cause: verified.value })
    }

    const session = await this.usuarioSessaoCollection.findById(verified.value.sid)
    if (session.left()) {
      return new InternalServerError({ message: session.value.message, cause: session.value })
    }
    if (!session.value) {
      return unauthorized()
    }

    if (UsuarioSessao.expired(session.value.expiresAt, this.now())) {
      const deleted = await this.usuarioSessaoCollection.deleteById(session.value.id)
      if (deleted.left()) {
        return new InternalServerError({ message: deleted.value.message, cause: deleted.value })
      }
      return unauthorized()
    }

    const usuario = await this.usuarioCollection.findById(verified.value.sub)
    if (usuario.left()) {
      return new InternalServerError({ message: usuario.value.message, cause: usuario.value })
    }
    if (!usuario.value) {
      return unauthorized()
    }

    return {
      id: usuario.value.id,
      nome: usuario.value.nome,
      email: usuario.value.email,
      tipo_usuario_id: usuario.value.tipoUsuarioId
    }
  }

  private attachAndAuthorize(
    request: HttpRequest,
    user: RequestUser,
    next: NextHandler
  ): Promise<HttpResponse | HttpError> {
    const auth = new Manager({ rules: createRules(user) })
    if (!auth.can(this.action, this.resource)) {
      return Promise.resolve(new ForbiddenError({ message: 'Forbidden' }))
    }

    request.user = user
    request.auth = auth
    return next()
  }
}

function unauthorized(params: { cause?: unknown } = {}): UnauthorizedError {
  return new UnauthorizedError({
    message: 'Unauthorized',
    type: 'unauthorized',
    cause: params.cause
  })
}
