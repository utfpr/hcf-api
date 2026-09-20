import { InfrastructureError } from './InfrastructureError'

export class ForeignKeyViolationError extends InfrastructureError {
  constructor(params: { message: string; cause?: unknown }) {
    super(params)
  }
}
