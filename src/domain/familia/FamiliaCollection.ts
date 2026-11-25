import { Either } from '@/library/either/Either'

import { Familia } from './Familia'

export interface FamiliaOrder {
  column: 'id' | 'nome' | 'reino'
  direction: 'asc' | 'desc'
}

export interface FamiliaFilters {
  nome?: string
  reino_id?: string
  order?: FamiliaOrder
}

export interface FamiliaCollection {
  findAll(filters: FamiliaFilters): Promise<Either<Error, Familia[]>>
  findById(id: string): Promise<Either<Error, Familia | undefined>>
}
