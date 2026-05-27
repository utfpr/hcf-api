import { Either } from '@/library/either/Either'

import { Attributes } from './Estado'

export interface EstadoFilters {
  paisSigla?: string
}

export interface EstadoCollection {
  findAll(filters: EstadoFilters): Promise<Either<Error, Attributes[]>>
}
