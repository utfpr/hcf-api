import { BaseError } from '@/library/BaseError'

export class RelevoEmUsoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Relevo está em uso em tombos e não pode ser removido',
      cause: params?.cause
    })
  }
}
