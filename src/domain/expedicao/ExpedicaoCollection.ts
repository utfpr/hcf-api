import { Either } from '@/library/either/Either'

import { Attributes, CreateAttributes } from './Expedicao'

export interface ExpedicaoOrder {
  column: 'id' | 'data_inicio' | 'data_fim'
  direction: 'asc' | 'desc'
}

export interface ExpedicaoFilters {
  pagina?: number
  limite?: number
  cidade_id?: number
  usuario_id?: number
  data_inicio_de?: string
  data_fim_ate?: string
  order?: ExpedicaoOrder
}

export interface Paginated<T> {
  itens: T[]
  total: number
  limite: number
  pagina: number
}
export interface ExpedicaoListItem extends Attributes {
  participantes: number[]
  rotas: number[]
}

export interface ExpedicaoCollection {
  findAll(filters: ExpedicaoFilters): Promise<Either<Error, Paginated<ExpedicaoListItem>>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>

  addParticipant(expedicaoId: number, usuarioId: number): Promise<Either<Error, void>>
  removeParticipant(expedicaoId: number, usuarioId: number): Promise<Either<Error, void>>

  substituteRoute(expedicaoId: number, rotas: number[]): Promise<Either<Error, void>>

}
