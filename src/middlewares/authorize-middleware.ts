import type {
  NextFunction, Request, Response
} from 'express'
import { type Knex } from 'knex'

import { AuthorizeMiddleware } from '@/application/AuthorizeMiddleware'
import { loadLegacyUsuario } from '@/application/loadLegacyUsuario'
import { createAccessToken } from '@/factory/AccessTokenFactory'
import { createKnexInstance } from '@/factory/KnexFactory'
import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'
import { UsuarioSessaoCollectionKnexAdapter } from '@/infrastructure/UsuarioSessaoCollectionKnexAdapter'
import { type Action, type Resource } from '@/library/auth/createRules'
import {
  type HttpRequest, Method, type RequestUser
} from '@/library/http/common'
import { ForbiddenError } from '@/library/http/error/ForbiddenError'
import { HttpError } from '@/library/http/error/HttpError'
import { parseCookieHeader } from '@/library/http/parseCookieHeader'
import { singleton } from '@/library/singleton'

import ForbiddenException from '../errors/forbidden-exception'
import UnauthorizedException from '../errors/unauthorized-exception'

type Authorize = (action: Action, resource: Resource) => AuthorizeMiddleware

export function wrapExpressAuthorize(authorizeHandler: Authorize) {
  return (action: Action, resource: Resource) => {
    const handler = authorizeHandler(action, resource)

    return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
      const httpRequest = toHttpRequest(request)
      const result = await handler.handle(httpRequest, () => Promise.resolve({ statusCode: 200 }))
      if (result instanceof HttpError) {
        next(toExpressError(result))
        return
      }

      request.user = httpRequest.user
      request.auth = httpRequest.auth
      request.usuario = httpRequest.user
      next()
    }
  }
}

interface Dependencies {
  knex: Knex
}

export function createExpressAuthorize({ knex }: Dependencies) {
  const accessToken = createAccessToken()
  const usuarioCollection = new UsuarioCollectionKnexAdapter({ knex })
  const usuarioSessaoCollection = new UsuarioSessaoCollectionKnexAdapter({ knex })

  return wrapExpressAuthorize((action, resource) => {
    return new AuthorizeMiddleware({
      action,
      resource,
      accessToken,
      usuarioCollection,
      usuarioSessaoCollection,
      legacyFallback: true,
      verifyLegacyUser: token => loadLegacyUsuario(token, usuarioCollection)
    })
  })
}

const defaultExpressAuthorize = singleton(() => {
  return createExpressAuthorize({ knex: createKnexInstance() })
})

export function authorize(action: Action, resource: Resource) {
  return defaultExpressAuthorize()(action, resource)
}

function toHttpRequest(request: Request): HttpRequest {
  return {
    method: request.method.toLowerCase() as Method,
    path: request.path,
    headers: request.headers as HttpRequest['headers'],
    cookies: parseCookieHeader(typeof request.headers.cookie === 'string' ? request.headers.cookie : undefined),
    params: { ...request.params, ...request.query },
    body: request.body
  }
}

function toExpressError(error: HttpError): Error {
  if (error instanceof ForbiddenError) {
    return new ForbiddenException(102)
  }

  if (error.type === 'access_expired') {
    const expired = new Error(error.message)
    expired.name = 'TokenExpiredError'
    return expired
  }

  return new UnauthorizedException(401)
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: RequestUser
    auth?: HttpRequest['auth']
    usuario?: RequestUser
  }
}
