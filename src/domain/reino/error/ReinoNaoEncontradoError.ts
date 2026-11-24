import { BaseError } from '@/library/BaseError'

export class ReinoNaoEncontradoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Reino não encontrado',
      cause: params?.cause
    })
  }
}
