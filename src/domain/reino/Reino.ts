import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  nome: string
}

export class Reino {
  readonly id: number
  readonly nome: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
  }

  static create(attributes: Attributes): Either<Error, Reino> {
    const nome = attributes.nome.trim()
    if (!nome) {
      return Either.left(new Error('Nome do reino não pode ser vazio'))
    }

    if (!Number.isInteger(attributes.id) || attributes.id <= 0) {
      return Either.left(new Error('id do reino deve ser um inteiro positivo'))
    }

    return Either.right(new Reino({ id: attributes.id, nome }))
  }
}
