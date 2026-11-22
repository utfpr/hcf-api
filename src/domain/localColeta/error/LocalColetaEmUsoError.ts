import { BaseError } from '@/library/BaseError'

export class LocalColetaEmUsoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Local de coleta está em uso em tombos e não pode ser removido',
      cause: params?.cause
    })
  }
}
