import { type AccessTokenError } from '@/library/auth/error/AccessTokenError'
import { type Either } from '@/library/either/Either'

export interface AccessPayload {
  sub: number
  sid: string
  typ: 'access'
  role: number
  iat: number
  exp: number
}

export interface AccessToken {
  sign(params: { sub: number; sid: string; role: number }): Either<AccessTokenError, string>
  verify(token: string): Either<AccessTokenError, AccessPayload>
}
