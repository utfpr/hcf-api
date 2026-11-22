import { BaseError } from '@/library/BaseError'

export class LocalColetaReferenciaInvalidaError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({ message: 'Cidade ou fase sucessional informada não existe', cause: params?.cause })
  }
}
