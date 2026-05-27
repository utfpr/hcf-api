import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  nome: string
  sigla: string | null
}

export class Pais {
  readonly id: number
  readonly nome: string
  readonly sigla: string | null

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
    this.sigla = attributes.sigla
  }

  static create(attributes: Attributes): Either<Error, Pais> {
    if (!attributes.nome.trim()) {
      return Either.left(new Error('Nome do país não pode ser vazio'))
    }
    return Either.right(new Pais(attributes))
  }
}
