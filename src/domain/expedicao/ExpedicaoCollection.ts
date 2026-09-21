import { Either } from '@/library/either/Either'

import { Attributes, CreateAttributes, ExpedicaoListItem, ExpedicaoDetalhada } from './Expedicao'

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

export interface PaginatedResult<T> {
  items: T[]
  total: number
  pagina: number
  limite: number
}

export interface ExpedicaoCollection {
  findAll(filters: ExpedicaoFilters): Promise<Either<Error, PaginatedResult<ExpedicaoListItem>>>
  findById(id: number): Promise<Either<Error, ExpedicaoDetalhada | null>>
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>

  addParticipant(expedicaoId: number, usuarioId: number): Promise<Either<Error, void>>
  removeParticipant(expedicaoId: number, usuarioId: number): Promise<Either<Error, void>>

  substituteRoute(expedicaoId: number, rotas: number[]): Promise<Either<Error, void>>
  
}
