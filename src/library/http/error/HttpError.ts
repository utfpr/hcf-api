import { BaseError } from '@/library/BaseError'

export class HttpError extends BaseError {
  readonly statusCode: number
  readonly report?: unknown

  constructor(params: { statusCode: number; message: string; report?: unknown; cause?: unknown }) {
    super(params)
    this.statusCode = params.statusCode
    this.report = params.report
  }
}
