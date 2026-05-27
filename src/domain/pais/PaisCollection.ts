import { Attributes } from '@/domain/pais/Pais'
import { Either } from '@/library/either/Either'

export interface PaisFilters {
  nome?: string
}

export interface PaisCollection {
  findAll(filters: PaisFilters): Promise<Either<Error, Attributes[]>>
}
