import { HttpError } from './HttpError'

export class NotFoundError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown }) {
    super({ statusCode: 404, ...params })
  }
}
