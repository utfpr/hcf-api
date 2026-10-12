import { HttpError } from './HttpError'

export class ConflictError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown }) {
    super({ ...params, statusCode: 409 })
  }
}
