import { BaseError } from '@/library/BaseError'

export class UserSessionNotFoundError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'User session was not found',
      cause: params?.cause
    })
  }
}
