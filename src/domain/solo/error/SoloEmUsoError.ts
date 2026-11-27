import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando uma tentativa de exclusão de solo falha por estar vinculado a tombos/coletas.
 */
export class SoloEmUsoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Solo está em uso em tombos e não pode ser removido',
      cause: params?.cause
    })
  }
}
