import { Either } from '@/library/either/Either'

import { Attributes, Solo } from './Solo'

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
  findById(id: number): Promise<Either<Error, Attributes | undefined>>
  findByNome(nome: string): Promise<Either<Error, Solo | undefined>>
  create(data: Pick<Attributes, 'nome'>): Promise<Either<Error, Solo>>
  update(id: number, data: Pick<Attributes, 'nome'>): Promise<Either<Error, Solo | undefined>>
  delete(id: number): Promise<Either<Error, boolean>>
}
