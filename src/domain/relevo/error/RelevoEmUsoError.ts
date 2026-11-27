import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando a remoção do relevo é impedida por estar vinculado a tombos.
 */
export class RelevoEmUsoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Relevo está em uso em tombos e não pode ser removido',
      cause: params?.cause
    })
  }
}
