import { Either } from '@/library/either/Either'

import { Reino } from './Reino'

export interface ReinoOrder {
  column: 'id' | 'nome'
  direction: 'asc' | 'desc'
}

export interface ReinoFilters {
  nome?: string
  order?: ReinoOrder
}

export interface ReinoCollection {
  findAll(filters: ReinoFilters): Promise<Either<Error, Reino[]>>
  findById(id: string): Promise<Either<Error, Reino | undefined>>
}
