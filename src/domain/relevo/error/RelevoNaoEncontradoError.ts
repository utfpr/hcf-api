import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando o relevo solicitado não for encontrado.
 */
export class RelevoNaoEncontradoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Relevo não encontrado',
      cause: params?.cause
    })
  }
}
