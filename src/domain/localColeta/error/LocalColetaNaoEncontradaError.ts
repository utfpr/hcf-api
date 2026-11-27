import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando o local de coleta não for encontrado pelo ID especificado.
 */
export class LocalColetaNaoEncontradaError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Local de coleta não encontrado',
      cause: params?.cause
    })
  }
}
