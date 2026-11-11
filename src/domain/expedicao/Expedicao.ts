import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  descricao: string | null
  data_inicio: string
  data_fim: string
  cidade_id: number
  created_at: Date
  updated_at: Date
  created_by: number | null
  updated_by: number | null
}

export interface ParticipanteDetalhado {
  id: number
  nome: string
  email: string
}

export interface RotaInput {
  cidade_id: number
  locais_coleta_ids: number[]
}

export interface RotaDetalhada {
  cidade_id: number
  ordem: number
  nome_cidade: string
  // id do estado da cidade da rota (mantido por compatibilidade)
  estado: string
  estado_nome: string | null
  estado_sigla: string | null
  // A criação garante que os locais são da cidade da rota
  locais_coleta: Array<{
    id: number
    descricao: string | null
  }>
}

export interface ExpedicaoDetalhada extends Attributes {
  participantes: ParticipanteDetalhado[]
  rotas: RotaDetalhada[]
}

type PersistedField = 'id' | 'created_at' | 'updated_at' | 'updated_by'

/**
 * Shape aceito pela entidade: uma linha nova ainda não tem id nem datas de
 * auditoria; o adapter devolve o registro completo depois do insert.
 */
export type EntityAttributes = Omit<Attributes, PersistedField> & Partial<Pick<Attributes, PersistedField>>

export type CreateAttributes =
  Omit<Attributes, PersistedField>
  & {
    participantes: number[]
    rotas: RotaInput[]
  }

export interface UpdateAttributes {
  descricao: string | null
  data_inicio: string
  data_fim: string
  cidade_id: number
  updated_by: number
}

export class Expedicao {
  readonly id?: number
  readonly descricao: string | null
  readonly data_inicio: string
  readonly data_fim: string
  readonly cidade_id: number
  readonly created_at?: Date
  readonly updated_at?: Date
  readonly created_by: number | null
  readonly updated_by?: number | null

  private constructor(attributes: EntityAttributes) {
    this.id = attributes.id
    this.descricao = attributes.descricao
    this.data_inicio = attributes.data_inicio
    this.data_fim = attributes.data_fim
    this.cidade_id = attributes.cidade_id
    this.created_at = attributes.created_at
    this.updated_at = attributes.updated_at
    this.created_by = attributes.created_by
    this.updated_by = attributes.updated_by
  }

  static create(attributes: EntityAttributes): Either<Error, Expedicao> {
    if (!attributes.data_inicio) {
      return Either.left(new Error('Data de início da expedição é obrigatória'))
    }

    if (!attributes.data_fim) {
      return Either.left(new Error('Data de fim da expedição é obrigatória'))
    }

    if (attributes.data_fim < attributes.data_inicio) {
      return Either.left(new Error('Data de fim da expedição não pode ser anterior à data de início'))
    }

    if (!Number.isInteger(attributes.cidade_id) || attributes.cidade_id <= 0) {
      return Either.left(new Error('Cidade de destino da expedição é obrigatória'))
    }

    return Either.right(new Expedicao(attributes))
  }

  toAttributes(): EntityAttributes {
    return {
      id: this.id,
      descricao: this.descricao,
      data_inicio: this.data_inicio,
      data_fim: this.data_fim,
      cidade_id: this.cidade_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by
    }
  }

  update(changes: UpdateAttributes): Either<Error, Expedicao> {
    return Expedicao.create({
      ...this.toAttributes(),
      ...changes,
      updated_at: new Date()
    })
  }
}
