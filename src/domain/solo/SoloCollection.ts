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
  create(data: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes>>
  update(id: number, data: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes | null>>
  delete(id: number): Promise<Either<Error, boolean>>
}
