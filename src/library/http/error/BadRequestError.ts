import { HttpError } from './HttpError'

export class BadRequestError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown }) {
    super({ statusCode: 400, ...params })
  }
}
