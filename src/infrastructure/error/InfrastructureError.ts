export class InfrastructureError extends Error {
  readonly cause?: unknown

  constructor(params: { message: string; cause?: unknown }) {
    super(params.message)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    this.name = this.constructor.name
    this.cause = params.cause
  }
}
