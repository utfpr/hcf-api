import { InfrastructureError } from './InfrastructureError'

export class DuplicateParticipantError extends InfrastructureError {
  constructor(params: { message: string; cause?: unknown }) {
    super(params)
  }
}
