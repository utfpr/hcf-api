import { Either } from '@/library/either/Either'

import { Attributes } from './Reino'

export interface ReinoOrder {
  column: 'id' | 'nome'
  direction: 'asc' | 'desc'
}

export interface ReinoFilters {
  nome?: string
  order?: ReinoOrder
}

export interface ReinoCollection {
  findAll(filters: ReinoFilters): Promise<Either<Error, Attributes[]>>
  findById(id: string): Promise<Either<Error, Attributes | undefined>>
}
