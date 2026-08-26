import { Either } from '@/library/either/Either'

import { Attributes } from './Solo'

export interface SoloOrder {
  column: 'id' | 'nome'
  direction: 'asc' | 'desc'
}

export interface SoloFilters {
  nome?: string
  order?: SoloOrder
}

export interface SoloCollection {
  findAll(filters: SoloFilters): Promise<Either<Error, Attributes[]>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
}
