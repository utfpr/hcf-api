import { HttpError } from './HttpError'

export class TooManyRequestsError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown }) {
    super({ ...params, statusCode: 429 })
  }
}
