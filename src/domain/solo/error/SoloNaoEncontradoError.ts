import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando o tipo de solo especificado não é encontrado.
 */
export class SoloNaoEncontradoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Solo não encontrado',
      cause: params?.cause
    })
  }
}
