import { type RefreshTokenError } from '@/library/auth/error/RefreshTokenError'
import { type Either } from '@/library/either/Either'

export interface RefreshToken {
  generate(): Either<RefreshTokenError, { token: string; hash: string }>
  hash(token: string): Either<RefreshTokenError, string>
}
