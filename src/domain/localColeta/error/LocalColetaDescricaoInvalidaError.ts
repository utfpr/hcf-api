import { BaseError } from '@/library/BaseError'

export class LocalColetaDescricaoInvalidaError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({ message: 'Descrição do local de coleta não pode ser vazia', cause: params?.cause })
  }
}
