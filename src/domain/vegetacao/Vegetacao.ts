import { Either } from '@/library/either/Either'

export interface Attributes {
  id?: string
  nome: string
}

export class Vegetacao {
  readonly id?: string
  readonly nome: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
  }

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

function isPositiveId(id: string): boolean {
  return /^\d+$/.test(id) && BigInt(id) > 0n
}
