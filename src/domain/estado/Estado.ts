import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  nome: string
  sigla: string
}

export class Estado {
  readonly id: number
  readonly nome: string
  readonly sigla: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
    this.sigla = attributes.sigla
  }

  static create(attributes: Attributes): Either<Error, Estado> {
    if (!attributes.nome.trim()) {
      return Either.left(new Error('Nome do estado não pode ser vazio'))
    }
    return Either.right(new Estado(attributes))
  }
}
