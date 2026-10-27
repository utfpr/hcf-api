import { BaseError } from '@/library/BaseError'

export class VegetacaoEmUsoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Vegetação está em uso e não pode ser removida',
      cause: params?.cause
    })
  }
}
