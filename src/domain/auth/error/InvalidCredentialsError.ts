import { BaseError } from '@/library/BaseError'

export class InvalidCredentialsError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'As credenciais enviadas são inválidas',
      cause: params?.cause
    })
  }
}
