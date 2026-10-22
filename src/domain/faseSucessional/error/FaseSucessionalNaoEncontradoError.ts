import { BaseError } from '@/library/BaseError'

export class FaseSucessionalNaoEncontradoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Fase sucessional não encontrada',
      cause: params?.cause
    })
  }
}
