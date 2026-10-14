import { BaseError } from '@/library/BaseError'

export class FaseSucessionalNomeDuplicadoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Já existe uma fase sucessional com esse nome',
      cause: params?.cause
    })
  }
}
