import { BaseError } from '@/library/BaseError'

export class HttpError extends BaseError {
  readonly statusCode: number
  readonly type: string
  readonly report?: unknown

  constructor(params: {
    statusCode: number
    type?: string
    message: string
    report?: unknown
    cause?: unknown
  }) {
    super({
      message: params.message,
      cause: params.cause
    })
    this.statusCode = params.statusCode
    this.type = params.type
    this.report = params.report
  }
}
