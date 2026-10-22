import { BaseError } from '@/library/BaseError'

export class RelevoNomeDuplicadoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Já existe um relevo com esse nome',
      cause: params?.cause
    })
  }
}
