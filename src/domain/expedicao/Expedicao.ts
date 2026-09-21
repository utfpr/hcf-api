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

export interface ExpedicaoListItem extends Attributes {
  participantes: number[]
  rotas: number[]
}

export interface ParticipanteDetalhado {
  id: number
  nome: string
  email: string
}

export interface RotaDetalhada {
  cidade_id: number
  ordem: number
  nome_cidade: string
  estado: string
}

export interface ExpedicaoDetalhada extends Attributes {
  participantes: ParticipanteDetalhado[]
  rotas: RotaDetalhada[]
}

export type CreateAttributes =
  Omit<Attributes, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
  & {
    participantes: number[]
    rotas: number[]
  }

export class Expedicao {
  readonly id: number
  readonly descricao: string | null
  readonly data_inicio: string
  readonly data_fim: string
  readonly cidade_id: number
  readonly created_at: Date
  readonly updated_at: Date
  readonly created_by: number | null
  readonly updated_by: number | null

  private constructor(attributes: Attributes) {
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

  static create(attributes: Attributes): Either<Error, Expedicao> {
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
}
