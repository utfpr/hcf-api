import { AccessTokenError } from './AccessTokenError'

export class AccessTokenInvalidError extends AccessTokenError {
  constructor(params: { cause?: unknown } = {}) {
    super({
      message: 'Access token is invalid',
      cause: params.cause
    })
  }
}
