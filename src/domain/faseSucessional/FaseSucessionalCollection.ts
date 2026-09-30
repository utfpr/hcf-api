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
  create(attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes>>
  update(id: number, attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes | null>>
  delete(id: number): Promise<Either<Error, boolean>>
}
