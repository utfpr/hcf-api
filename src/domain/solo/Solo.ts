import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  nome: string
}

export class Solo {
  readonly id: number
  readonly nome: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
  }

  static create(attributes: Attributes): Either<Error, Solo> {
    if (!attributes.nome.trim()) {
      return Either.left(new Error('Nome do solo não pode ser vazio'))
    }

    return Either.right(new Solo(attributes))
  }
}
