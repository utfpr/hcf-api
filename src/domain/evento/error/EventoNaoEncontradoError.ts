import { BaseError } from '@/library/BaseError'

export class EventoNaoEncontradoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Evento não encontrado',
      cause: params?.cause
    })
  }
}
