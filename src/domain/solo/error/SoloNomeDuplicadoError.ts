import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado ao tentar cadastrar ou renomear um solo com nome já existente.
 */
export class SoloNomeDuplicadoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Já existe um solo com esse nome',
      cause: params?.cause
    })
  }
}
