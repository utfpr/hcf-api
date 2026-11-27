import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado quando a descrição do local de coleta for vazia ou inválida.
 */
export class LocalColetaDescricaoInvalidaError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({ message: 'Descrição do local de coleta não pode ser vazia', cause: params?.cause })
  }
}
