import { BaseError } from '@/library/BaseError'

export class UserNotFoundError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'User was not found',
      cause: params?.cause
    })
  }
}
