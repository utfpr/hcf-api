import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  nome: string
}

export class FaseSucessional {
  readonly id?: number
  readonly nome: string

  private constructor(attributes: Omit<Attributes, 'id'> & { id?: number }) {
    this.id = attributes.id
    this.nome = attributes.nome
  }

  static create(attributes: Pick<Attributes, 'nome'> & { id?: number }): Either<Error, FaseSucessional> {
    const nome = attributes.nome.trim()

    if (!nome) {
      return Either.left(new Error('Nome da fase sucessional não pode ser vazio'))
    }

    return Either.right(new FaseSucessional({ id: attributes.id, nome }))
  }
}
