import { Either } from '@/library/either/Either'

import { Attributes, CreateAttributes } from './Expedicao'

export interface ExpedicaoOrder {
  column: 'id' | 'data_inicio' | 'data_fim'
  direction: 'asc' | 'desc'
}

export interface ExpedicaoFilters {
  cidade_id?: number
  usuario_id?: number
  data_inicio_de?: string
  data_fim_ate?: string
  order?: ExpedicaoOrder
}

export interface ExpedicaoCollection {
  findAll(filters: ExpedicaoFilters): Promise<Either<Error, Attributes[]>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>
}
