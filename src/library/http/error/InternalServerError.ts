import { HttpError } from './HttpError'

export class InternalServerError extends HttpError {
  constructor(params: { message: string; report?: unknown; cause?: unknown }) {
    super({
      ...params, statusCode: 500, type: 'internal_server_error'
    })
  }
}
