import { BaseError } from '@/library/BaseError'

export class SoloNaoEncontradoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Solo não encontrado',
      cause: params?.cause
    })
  }
}
