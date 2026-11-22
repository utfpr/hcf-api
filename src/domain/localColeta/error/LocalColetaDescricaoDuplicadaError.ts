import { BaseError } from '@/library/BaseError'

export class LocalColetaDescricaoDuplicadaError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Já existe um local de coleta com essa descrição na cidade informada',
      cause: params?.cause
    })
  }
}
