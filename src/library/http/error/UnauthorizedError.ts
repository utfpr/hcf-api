import { HttpError } from './HttpError'

export class UnauthorizedError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown }) {
    super({ ...params, statusCode: 401 })
  }
}
