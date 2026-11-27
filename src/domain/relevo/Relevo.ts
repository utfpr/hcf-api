import { Either } from '@/library/either/Either'

/**
 * Atributos que definem a entidade Relevo.
 */
export interface Attributes {
  id?: string
  nome: string
}

/**
 * Entidade de domínio que representa uma classificação de relevo topográfico.
 */
export class Relevo {
  readonly id?: string
  readonly nome: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
  }

  /**
   * Fábrica para criar e validar uma instância de Relevo.
   *
   * @param input Dados para instanciação, incluindo nome e id opcional.
   * @returns Either com a entidade Relevo criada ou erro de validação (nome vazio ou ID inválido).
   */
  static create(input: { nome: string; id?: string }): Either<Error, Relevo> {
    const nome = input.nome.trim()
    if (!nome) {
      return Either.left(new Error('Nome do relevo não pode ser vazio'))
    }

    if (input.id !== undefined && !isPositiveId(input.id)) {
      return Either.left(new Error('id do relevo deve ser um inteiro positivo'))
    }

    return Either.right(new Relevo({
      nome,
      id: input.id
    }))
  }
}

/**
 * Verifica se a string representa um número inteiro positivo.
 *
 * @param id String a ser validada.
 * @returns true se for um número inteiro maior que zero.
 */
function isPositiveId(id: string): boolean {
  return /^\d+$/.test(id) && BigInt(id) > 0n
}
