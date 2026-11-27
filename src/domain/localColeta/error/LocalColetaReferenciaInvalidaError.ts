import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando a cidade ou fase sucessional referenciada no local de coleta não existir no banco.
 */
export class LocalColetaReferenciaInvalidaError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({ message: 'Cidade ou fase sucessional informada não existe', cause: params?.cause })
  }
}
