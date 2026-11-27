import { Either } from '@/library/either/Either'

/**
 * Atributos que definem a entidade Solo.
 */
export interface Attributes {
  id?: number
  nome: string
}

/**
 * Entidade de domínio que representa um tipo de solo catalogado.
 */
export class Solo {
  readonly id?: number
  readonly nome: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
  }

  /**
   * Fábrica para criar e validar uma instância de Solo.
   *
   * @param attributes Atributos do tipo de solo.
   * @returns Either com a entidade Solo criada ou erro de validação de nome vazio.
   */
  static create(attributes: Attributes): Either<Error, Solo> {
    if (!attributes.nome.trim()) {
      return Either.left(new Error('Nome do solo não pode ser vazio'))
    }

    return Either.right(new Solo(attributes))
  }
}
