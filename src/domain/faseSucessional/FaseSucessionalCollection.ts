import { Either } from '@/library/either/Either'

import { Attributes } from './FaseSucessional'

export interface FaseSucessionalFilters {
  nome?: string
  order?: {
    column: 'id' | 'nome'
    direction: 'asc' | 'desc'
  }
}

export interface FaseSucessionalCollection {
  findAll(filters: FaseSucessionalFilters): Promise<Either<Error, Attributes[]>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
}
