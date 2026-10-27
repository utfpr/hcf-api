import jwt from 'jsonwebtoken'

import { type AccessPayload, type AccessToken } from '@/library/auth/AccessToken'
import { AccessTokenError } from '@/library/auth/error/AccessTokenError'
import { AccessTokenExpiredError } from '@/library/auth/error/AccessTokenExpiredError'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import { Either } from '@/library/either/Either'

const ACCESS_EXPIRES_IN = '15m'
const ACCESS_TYP = 'access'
const ACCESS_ALGORITHM = 'HS256'

export class JwtAccessToken implements AccessToken {
  private readonly secret: string

  constructor(params: { secret: string }) {
    if (!params.secret) {
      throw new Error('JWT secret is not set')
    }

    this.secret = params.secret
  }

  sign(params: { sub: number; sid: string }): Either<AccessTokenError, string> {
    try {
      return Either.right(jwt.sign(
        {
          sub: String(params.sub),
          sid: params.sid,
          typ: ACCESS_TYP
        },
        this.secret,
        {
          algorithm: ACCESS_ALGORITHM,
          expiresIn: ACCESS_EXPIRES_IN
        }
      ))
    } catch (error) {
      return Either.left(new AccessTokenError({
        message: 'Failed to sign access token',
        cause: error
      }))
    }
  }

  verify(token: string): Either<AccessTokenError, AccessPayload> {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: [ACCESS_ALGORITHM]
      })
      if (typeof decoded === 'string') {
        return Either.left(new AccessTokenInvalidError())
      }

      const payload = this.parseAccessPayload(decoded)
      if (!payload) {
        return Either.left(new AccessTokenInvalidError())
      }

      return Either.right(payload)
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return Either.left(new AccessTokenExpiredError({ cause: error }))
      }
      return Either.left(new AccessTokenInvalidError({ cause: error }))
    }
  }

  private parseAccessPayload(decoded: jwt.JwtPayload): AccessPayload | undefined {
    const claims: Record<string, unknown> = decoded
    const sub = Number(decoded.sub)
    const sid = claims.sid
    const typ = claims.typ
    const iat = claims.iat
    const exp = claims.exp

    if (
      !Number.isInteger(sub)
      || typeof sid !== 'string'
      || sid.length === 0
      || typ !== ACCESS_TYP
      || typeof iat !== 'number'
      || typeof exp !== 'number'
    ) {
      return undefined
    }

    return {
      sub,
      sid,
      typ: ACCESS_TYP,
      iat,
      exp
    }
  }
}
