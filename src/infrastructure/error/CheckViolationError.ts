import { InfrastructureError } from './InfrastructureError'

export class CheckViolationError extends InfrastructureError {
  constructor(params: { message: string; cause?: unknown }) {
    super(params)
  }
}
