import { Either } from '@/library/either/Either'

import { Attributes } from './Relevo'

export interface RelevoOrder {
  column: 'id' | 'nome'
  direction: 'asc' | 'desc'
}

export interface RelevoFilters {
  nome?: string
  order?: RelevoOrder
}

export interface RelevoCollection {
  findAll(filters: RelevoFilters): Promise<Either<Error, Attributes[]>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
}
