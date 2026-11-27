import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando já existe uma fase sucessional com o mesmo nome.
 */
export class FaseSucessionalNomeDuplicadoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Já existe uma fase sucessional com esse nome',
      cause: params?.cause
    })
  }
}
