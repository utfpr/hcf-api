import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado ao tentar excluir um local de coleta referenciado em registros de tombos.
 */
export class LocalColetaEmUsoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Local de coleta está em uso em tombos e não pode ser removido',
      cause: params?.cause
    })
  }
}
