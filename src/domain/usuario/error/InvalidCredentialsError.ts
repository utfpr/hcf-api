import { BaseError } from '@/library/BaseError'

export class InvalidCredentialsError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Credenciais inválidas',
      cause: params?.cause
    })
  }
}
