import { HttpError } from './HttpError'

export class ForbiddenError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown }) {
    super({ ...params, statusCode: 403 })
  }
}
