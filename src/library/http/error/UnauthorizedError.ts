import { type Headers } from '@/library/http/common'

import { HttpError } from './HttpError'

export class UnauthorizedError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown; headers?: Partial<Headers> }) {
    super({ ...params, statusCode: 401 })
  }
}
