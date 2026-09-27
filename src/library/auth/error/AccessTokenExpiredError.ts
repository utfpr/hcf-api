import { AccessTokenError } from './AccessTokenError'

export class AccessTokenExpiredError extends AccessTokenError {
  constructor(params: { cause?: unknown } = {}) {
    super({
      message: 'Access token expired',
      cause: params.cause
    })
  }
}
