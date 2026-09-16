import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  evento_id: number
  nome: string
  capturado_em: Date
  created_at: Date
  updated_at: Date
  created_by: number | null
  updated_by: number | null
}

export type CreateAttributes = Omit<Attributes, 'id' | 'created_at' | 'updated_at' | 'updated_by'>

export class Evidencia {
  readonly id: number
  readonly evento_id: number
  readonly nome: string
  readonly capturado_em: Date
  readonly created_at: Date
  readonly updated_at: Date
  readonly created_by: number | null
  readonly updated_by: number | null

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.evento_id = attributes.evento_id
    this.nome = attributes.nome
    this.capturado_em = attributes.capturado_em
    this.created_at = attributes.created_at
    this.updated_at = attributes.updated_at
    this.created_by = attributes.created_by
    this.updated_by = attributes.updated_by
  }

  static create(attributes: Attributes): Either<Error, Evidencia> {
    if (!Number.isInteger(attributes.evento_id) || attributes.evento_id <= 0) {
      return Either.left(new Error('Evento da evidência é obrigatório'))
    }

    if (!attributes.nome.trim()) {
      return Either.left(new Error('Nome da evidência não pode ser vazio'))
    }

    if (Number.isNaN(attributes.capturado_em.getTime())) {
      return Either.left(new Error('Instante de captura da evidência é inválido'))
    }

    return Either.right(new Evidencia(attributes))
  }
}
