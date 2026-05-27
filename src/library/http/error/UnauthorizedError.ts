import { HttpError } from './HttpError'

export class UnauthorizedError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown }) {
    super({ statusCode: 401, ...params })
  }
}
