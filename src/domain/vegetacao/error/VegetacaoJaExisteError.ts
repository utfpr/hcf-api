import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado ao tentar cadastrar ou renomear uma vegetação para um nome já existente.
 */
export class VegetacaoJaExisteError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Já existe uma vegetação com esse nome',
      cause: params?.cause
    })
  }
}
