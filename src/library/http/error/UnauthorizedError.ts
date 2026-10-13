import { HttpError } from './HttpError'

export type UnauthorizedErrorType = 'unauthorized' | 'access_expired'

export class UnauthorizedError extends HttpError {
  constructor(params: {
    message: string
    type?: UnauthorizedErrorType
    report?: unknown
    cause?: unknown
  }) {
    super({
      ...params,
      statusCode: 401,
      type: params.type ?? 'unauthorized'
    })
  }
}
