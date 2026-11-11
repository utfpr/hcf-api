import { BaseError } from '@/library/BaseError'

export class LocalColetaNaoEncontradaError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Local de coleta não encontrado',
      cause: params?.cause
    })
  }
}
