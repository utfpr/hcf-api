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
}
