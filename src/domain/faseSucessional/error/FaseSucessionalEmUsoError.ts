import { BaseError } from '@/library/BaseError'

export class FaseSucessionalEmUsoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Fase sucessional está em uso e não pode ser removida',
      cause: params?.cause
    })
  }
}
