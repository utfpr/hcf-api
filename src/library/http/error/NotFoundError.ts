import { HttpError } from './HttpError'

export class NotFoundError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown }) {
    super({ ...params, statusCode: 404 })
  }
}
