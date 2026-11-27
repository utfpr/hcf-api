import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando há tentativa de cadastrar ou renomear relevo para um nome já existente.
 */
export class RelevoNomeDuplicadoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Já existe um relevo com esse nome',
      cause: params?.cause
    })
  }
}
