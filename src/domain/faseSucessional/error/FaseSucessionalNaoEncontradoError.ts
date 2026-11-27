import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando a fase sucessional não for encontrada pelo ID informado.
 */
export class FaseSucessionalNaoEncontradoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Fase sucessional não encontrada',
      cause: params?.cause
    })
  }
}
