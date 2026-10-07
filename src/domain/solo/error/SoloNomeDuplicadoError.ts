import { BaseError } from '@/library/BaseError'

export class SoloNomeDuplicadoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Já existe um solo com esse nome',
      cause: params?.cause
    })
  }
}
