import { Either } from '@/library/either/Either'

import { Attributes, Vegetacao } from './Vegetacao'

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
  findById(id: string): Promise<Either<Error, Attributes | undefined>>
  create(data: Pick<Attributes, 'nome'>): Promise<Either<Error, Vegetacao>>
  update(id: string, data: Pick<Attributes, 'nome'>): Promise<Either<Error, Vegetacao | undefined>>
  delete(id: string): Promise<Either<Error, boolean>>
}
