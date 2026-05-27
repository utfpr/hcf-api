import { InfrastructureError } from './InfrastructureError'

export class CollectionError extends InfrastructureError {
  constructor(params: { message: string; cause?: unknown }) {
    super(params)
  }
}
