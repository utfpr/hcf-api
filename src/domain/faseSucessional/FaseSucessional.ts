import { Either } from '@/library/either/Either'

export interface Attributes {
  id?: string
  nome: string
}

export class FaseSucessional {
  readonly id?: string
  readonly nome: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
  }

  static create(attributes: { nome: string; id?: string }): Either<Error, FaseSucessional> {
    const nome = attributes.nome.trim()

    if (!nome) {
      return Either.left(new Error('Nome da fase sucessional não pode ser vazio'))
    }

    if (attributes.id !== undefined && !isPositiveId(attributes.id)) {
      return Either.left(new Error('id da fase sucessional deve ser um inteiro positivo'))
    }

    return Either.right(new FaseSucessional({
      id: attributes.id,
      nome
    }))
  }
}

function isPositiveId(id: string): boolean {
  return /^\d+$/.test(id) && BigInt(id) > 0n
}
