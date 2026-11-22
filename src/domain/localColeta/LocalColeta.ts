import { Either } from '@/library/either/Either'

import { LocalColetaDescricaoInvalidaError } from './error/LocalColetaDescricaoInvalidaError'

export interface LocalColetaRelation {
  id: number | string
  nome: string
  sigla?: string | null
  estado?: LocalColetaRelation | null
  pais?: LocalColetaRelation | null
}

export interface LocalColetaRecord {
  id: number | string
  descricao: string | null
  cidade_id: number | string | null
  fase_sucessional_id: number | string | null
  cidade: LocalColetaRelation | null
  fase_sucessional: Pick<LocalColetaRelation, 'id' | 'nome'> | null
}

export interface LocalColetaAttributes {
  descricao: string
  cidade_id: number
  fase_sucessional_id?: number | null
}

export class LocalColeta {
  readonly id?: number | string
  readonly descricao: string | null
  readonly cidade_id: number | string | null
  readonly fase_sucessional_id?: number | string | null
  readonly cidade?: LocalColetaRelation | null
  readonly fase_sucessional?: Pick<LocalColetaRelation, 'id' | 'nome'> | null

  private constructor(attributes: LocalColetaAttributes | LocalColetaRecord) {
    Object.assign(this, attributes)
    this.descricao = attributes.descricao
    this.cidade_id = attributes.cidade_id
  }

  static create(attributes: LocalColetaAttributes | LocalColetaRecord): Either<Error, LocalColeta> {
    // Persisted legacy rows may have a null or blank description. Preserve reads.
    if ('id' in attributes) return Either.right(new LocalColeta(attributes))
    const descricao = attributes.descricao.trim().replace(/\s+/g, ' ')
    if (!descricao) return Either.left(new LocalColetaDescricaoInvalidaError())
    return Either.right(new LocalColeta({ ...attributes, descricao }))
  }
}
