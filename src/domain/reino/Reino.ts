import { Either } from '@/library/either/Either'

export interface Attributes {
  id?: number | string
  nome: string
}

export class Reino {
  readonly id?: string
  readonly nome: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id === undefined ? undefined : String(attributes.id)
    this.nome = attributes.nome
  }

  static create(input: { nome: string; id?: string }): Either<Error, Reino> {
    const nome = input.nome.trim()
    if (!nome) {
      return Either.left(new Error('Nome do reino não pode ser vazio'))
    }

    if (input.id !== undefined && !isPositiveId(input.id)) {
      return Either.left(new Error('id do reino deve ser um inteiro positivo'))
    }

    return Either.right(new Reino({ nome, id: input.id }))
  }
}

function isPositiveId(id: string): boolean {
  return /^\d+$/.test(id) && BigInt(id) > 0n
}
