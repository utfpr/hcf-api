import { Either } from '@/library/either/Either'

/**
 * Atributos que definem a entidade Estado.
 */
export interface Attributes {
  id: number
  nome: string
  sigla: string
}

/**
 * Entidade de domínio que representa uma unidade federativa (Estado).
 */
export class Estado {
  readonly id: number
  readonly nome: string
  readonly sigla: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
    this.sigla = attributes.sigla
  }

  /**
   * Fábrica para criar e validar uma instância de Estado.
   *
   * @param attributes Atributos do estado (id, nome, sigla).
   * @returns Either com a entidade Estado criada ou erro de validação de nome vazio.
   */
  static create(attributes: Attributes): Either<Error, Estado> {
    if (!attributes.nome.trim()) {
      return Either.left(new Error('Nome do estado não pode ser vazio'))
    }
    return Either.right(new Estado(attributes))
  }
}
