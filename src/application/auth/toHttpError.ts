import { InvalidCredentialsError } from '@/domain/auth/error/InvalidCredentialsError'
import { UserNotFoundError } from '@/domain/auth/error/UserNotFoundError'
import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { AccessTokenError } from '@/library/auth/error/AccessTokenError'
import { RefreshTokenError } from '@/library/auth/error/RefreshTokenError'
import { type Headers } from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

export function toHttpError(error: Error, headers?: Partial<Headers>): HttpError {
  if (error instanceof HttpError) {
    return error
  }

  if (
    error instanceof AccessTokenError
    || error instanceof RefreshTokenError
    || error instanceof InvalidCredentialsError
    || error instanceof UserNotFoundError
    || error instanceof UserSessionNotFoundError
  ) {
    return new UnauthorizedError({
      message: error.message,
      cause: error,
      report: { name: error.name },
      headers
    })
  }

  return new InternalServerError({
    message: error.message,
    cause: error
  })
}
