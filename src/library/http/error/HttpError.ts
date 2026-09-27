import { BaseError } from '@/library/BaseError'
import { type Headers } from '@/library/http/common'

export class HttpError extends BaseError {
  readonly statusCode: number
  readonly report?: unknown
  readonly headers?: Partial<Headers>

  constructor(params: {
    statusCode: number
    message: string
    report?: unknown
    cause?: unknown
    headers?: Partial<Headers>
  }) {
    super(params)
    this.statusCode = params.statusCode
    this.report = params.report
    this.headers = params.headers
  }
}
