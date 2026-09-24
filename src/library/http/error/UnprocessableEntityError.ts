import { HttpError } from './HttpError'

export class UnprocessableEntityError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown }) {
    super({ ...params, statusCode: 422 })
  }
}
