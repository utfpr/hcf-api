import { Either } from '@/library/either/Either'

import { LocalColetaDescricaoInvalidaError } from './error/LocalColetaDescricaoInvalidaError'

/**
 * Representação resumida de entidade relacionada a local de coleta (ex: Cidade, Estado, País).
 */
export interface LocalColetaRelation {
  id: number | string
  nome: string
  sigla?: string | null
  estado?: LocalColetaRelation | null
  pais?: LocalColetaRelation | null
}

/**
 * Registro de local de coleta completo conforme lido do banco de dados relacional.
 */
export interface LocalColetaRecord {
  id: number | string
  descricao: string | null
  cidade_id: number | string | null
  fase_sucessional_id: number | string | null
  cidade: LocalColetaRelation | null
  fase_sucessional: Pick<LocalColetaRelation, 'id' | 'nome'> | null
}

/**
 * Atributos necessários para criação ou atualização de local de coleta.
 */
export interface LocalColetaAttributes {
  descricao: string
  cidade_id: number
  fase_sucessional_id?: number | null
}

/**
 * Entidade de domínio que representa um local geográfico específico de coleta botânica.
 */
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

  /**
   * Fábrica para criar e validar um LocalColeta.
   * Preserva leituras de registros legados pré-existentes sem descrição válida.
   *
   * @param attributes Atributos para criação ou registro lido.
   * @returns Either com a entidade LocalColeta ou erro se a descrição for vazia.
   */
  static create(attributes: LocalColetaAttributes | LocalColetaRecord): Either<Error, LocalColeta> {
    // Linhas legadas persistidas podem possuir descrição nula ou em branco; preserva leituras existentes
    if ('id' in attributes) return Either.right(new LocalColeta(attributes))
    const descricao = attributes.descricao.trim().replace(/\s+/g, ' ')
    if (!descricao) return Either.left(new LocalColetaDescricaoInvalidaError())
    return Either.right(new LocalColeta({ ...attributes, descricao }))
  }
}
