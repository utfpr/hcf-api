import { Either } from '@/library/either/Either'

import { Attributes } from './Vegetacao'

export interface VegetacaoOrder {
  column: 'id' | 'nome'
  direction: 'asc' | 'desc'
}

export interface VegetacaoFilters {
  nome?: string
  order?: VegetacaoOrder
}

export interface VegetacaoCollection {
  findAll(filters: VegetacaoFilters): Promise<Either<Error, Attributes[]>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
  create(data: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes>>
  update(id: number, data: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes | null>>
  delete(id: number): Promise<Either<Error, boolean>>
}
