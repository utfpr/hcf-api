import { BaseError } from '@/library/BaseError'

export class VegetacaoJaExisteError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Já existe uma vegetação com esse nome',
      cause: params?.cause
    })
  }
}
