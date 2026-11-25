import { Reino } from '@/domain/reino/Reino'
import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  nome: string
  reino: Reino | null
}

export class Familia {
  readonly id: number
  readonly nome: string
  readonly reino: Reino | null

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
    this.reino = attributes.reino
  }

  static create(attributes: Attributes): Either<Error, Familia> {
    const nome = attributes.nome.trim()
    if (!nome) {
      return Either.left(new Error('Nome da família não pode ser vazio'))
    }

    if (!Number.isInteger(attributes.id) || attributes.id <= 0) {
      return Either.left(new Error('id da família deve ser um inteiro positivo'))
    }

    return Either.right(new Familia({
      id: attributes.id,
      nome,
      reino: attributes.reino
    }))
  }
}
