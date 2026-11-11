import { BaseError } from '@/library/BaseError'

export class ExpedicaoNaoEncontradaError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Expedição não encontrada',
      cause: params?.cause
    })
  }
}
