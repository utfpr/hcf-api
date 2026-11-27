import { BaseError } from '@/library/BaseError'

/**
 * Erro lançado ao tentar remover uma fase sucessional que está em uso no sistema.
 */
export class FaseSucessionalEmUsoError extends BaseError {
  constructor(params?: { cause?: unknown }) {
    super({
      message: 'Fase sucessional está em uso e não pode ser removida',
      cause: params?.cause
    })
  }
}
