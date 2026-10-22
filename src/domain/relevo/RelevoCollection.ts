import { Either } from '@/library/either/Either'

import { Attributes, Relevo } from './Relevo'

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
  findById(id: string): Promise<Either<Error, Attributes | undefined>>
  create(attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Relevo>>
  updateById(id: string, attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Relevo | undefined>>
  deleteById(id: string): Promise<Either<Error, boolean>>
  countTomboReferences(id: string): Promise<Either<Error, number>>
}
