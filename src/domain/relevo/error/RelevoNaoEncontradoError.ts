import { BaseError } from '@/library/BaseError'

export class RelevoNaoEncontradoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Relevo não encontrado',
      cause: params?.cause
    })
  }
}
