import { BaseError } from '@/library/BaseError'

export class SoloEmUsoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Solo está em uso em tombos e não pode ser removido',
      cause: params?.cause
    })
  }
}
