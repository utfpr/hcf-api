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
  findByNome(nome: string): Promise<Either<Error, Attributes | null>>
  create(attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes>>
  updateById(id: number, attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes | null>>
  deleteById(id: number): Promise<Either<Error, boolean>>
  countTomboReferences(id: number): Promise<Either<Error, number>>
}
