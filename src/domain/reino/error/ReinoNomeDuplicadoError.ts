import { BaseError } from '@/library/BaseError'

export class ReinoNomeDuplicadoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Já existe um reino com esse nome',
      cause: params?.cause
    })
  }
}
