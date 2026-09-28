import { createHash, randomBytes } from 'node:crypto'

import { RefreshTokenError } from '@/library/auth/error/RefreshTokenError'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

export class CryptoRefreshToken implements RefreshToken {
  generate(): Either<RefreshTokenError, { token: string; hash: string }> {
    try {
      const token = randomBytes(32).toString('base64url')
      const hashed = this.hash(token)
      if (hashed.left()) {
        return hashed
      }

      return Either.right({
        token,
        hash: hashed.value
      })
    } catch (error) {
      return Either.left(new RefreshTokenError({
        message: 'Failed to generate refresh token',
        cause: error
      }))
    }
  }

  hash(token: string): Either<RefreshTokenError, string> {
    try {
      return Either.right(createHash('sha256').update(token, 'utf8').digest('hex'))
    } catch (error) {
      return Either.left(new RefreshTokenError({
        message: 'Failed to hash refresh token',
        cause: error
      }))
    }
  }
}
