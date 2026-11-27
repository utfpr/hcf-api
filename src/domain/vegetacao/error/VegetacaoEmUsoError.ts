import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando a remoção da vegetação é impedida por estar em uso no sistema.
 */
export class VegetacaoEmUsoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Vegetação está em uso e não pode ser removida',
      cause: params?.cause
    })
  }
}
