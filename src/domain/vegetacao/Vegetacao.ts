import { Either } from '@/library/either/Either'

/**
 * Atributos que definem a entidade Vegetacao.
 */
export interface Attributes {
  id?: string
  nome: string
}

/**
 * Entidade de domínio que representa uma classificação de tipo de vegetação.
 */
export class Vegetacao {
  readonly id?: string
  readonly nome: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
  }

  /**
   * Fábrica para criar e validar uma instância de Vegetacao.
   *
   * @param input Dados para instanciação incluindo nome e id opcional.
   * @returns Either com a entidade criada ou erro de validação (nome vazio ou ID inválido).
   */
  static create(input: { nome: string; id?: string }): Either<Error, Vegetacao> {
    const nome = input.nome.trim()
    if (!nome) {
      return Either.left(new Error('Nome da vegetação não pode ser vazio'))
    }

    if (input.id !== undefined && !isPositiveId(input.id)) {
      return Either.left(new Error('id da vegetação deve ser um inteiro positivo'))
    }

    return Either.right(new Vegetacao({
      nome,
      id: input.id
    }))
  }
}

/**
 * Valida se a string representa um número inteiro positivo.
 *
 * @param id String a ser validada.
 * @returns true se for um número inteiro maior que zero.
 */
function isPositiveId(id: string): boolean {
  return /^\d+$/.test(id) && BigInt(id) > 0n
}
