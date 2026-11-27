import { Either } from '@/library/either/Either'

/**
 * Atributos que definem a entidade Pais.
 */
export interface Attributes {
  id: number
  nome: string
  sigla: string | null
}

/**
 * Entidade de domínio que representa um país catalogado.
 */
export class Pais {
  readonly id: number
  readonly nome: string
  readonly sigla: string | null

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
    this.sigla = attributes.sigla
  }

  /**
   * Fábrica para criar e validar uma instância de Pais.
   *
   * @param attributes Atributos do país (id, nome, sigla).
   * @returns Either com a entidade Pais criada ou erro se o nome for vazio.
   */
  static create(attributes: Attributes): Either<Error, Pais> {
    if (!attributes.nome.trim()) {
      return Either.left(new Error('Nome do país não pode ser vazio'))
    }
    return Either.right(new Pais(attributes))
  }
}
