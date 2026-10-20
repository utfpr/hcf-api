import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  evento_id: number
  nome: string
  arquivo: string
  mime_type: string
  tamanho: number
  data_captura: Date
  // Chave de idempotência do app (offline); null para o que veio do web
  client_uuid?: string | null
  created_at: Date
  updated_at: Date
  created_by: number | null
  updated_by: number | null
}

type PersistedField = 'id' | 'created_at' | 'updated_at' | 'updated_by'

export type CreateAttributes = Omit<Attributes, PersistedField>

/**
 * Shape aceito pela entidade: uma linha nova ainda não tem id nem datas de
 * auditoria; o adapter devolve o registro completo depois do insert.
 */
export type EntityAttributes = CreateAttributes & Partial<Pick<Attributes, PersistedField>>

export class Evidencia {
  readonly id?: number
  readonly evento_id: number
  readonly nome: string
  readonly arquivo: string
  readonly mime_type: string
  readonly tamanho: number
  readonly data_captura: Date
  readonly created_at?: Date
  readonly updated_at?: Date
  readonly created_by: number | null
  readonly updated_by?: number | null

  private constructor(attributes: EntityAttributes) {
    this.id = attributes.id
    this.evento_id = attributes.evento_id
    this.nome = attributes.nome
    this.arquivo = attributes.arquivo
    this.mime_type = attributes.mime_type
    this.tamanho = attributes.tamanho
    this.data_captura = attributes.data_captura
    this.created_at = attributes.created_at
    this.updated_at = attributes.updated_at
    this.created_by = attributes.created_by
    this.updated_by = attributes.updated_by
  }

  static create(attributes: EntityAttributes): Either<Error, Evidencia> {
    if (!Number.isInteger(attributes.evento_id) || attributes.evento_id <= 0) {
      return Either.left(new Error('Evento da evidência é obrigatório'))
    }

    if (!attributes.nome.trim()) {
      return Either.left(new Error('Nome da evidência não pode ser vazio'))
    }

    if (!attributes.arquivo.trim()) {
      return Either.left(new Error('Arquivo da evidência é obrigatório'))
    }

    if (!attributes.mime_type.trim()) {
      return Either.left(new Error('Tipo do arquivo da evidência é obrigatório'))
    }

    if (!Number.isInteger(attributes.tamanho) || attributes.tamanho <= 0) {
      return Either.left(new Error('Tamanho do arquivo da evidência é inválido'))
    }

    if (Number.isNaN(attributes.data_captura.getTime())) {
      return Either.left(new Error('Instante de captura da evidência é inválido'))
    }

    return Either.right(new Evidencia(attributes))
  }
}
