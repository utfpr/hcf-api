import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  nome: string
}

export class FaseSucessional {
  readonly id: number
  readonly nome: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
  }

  static create(attributes: Attributes): Either<Error, FaseSucessional> {
    if (!attributes.nome.trim()) {
      return Either.left(new Error('Nome da fase sucessional não pode ser vazio'))
    }

    return Either.right(new FaseSucessional(attributes))
  }
}
