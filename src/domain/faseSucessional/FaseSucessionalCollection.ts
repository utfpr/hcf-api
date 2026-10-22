import { Either } from '@/library/either/Either'

import { Attributes, FaseSucessional } from './FaseSucessional'

export interface FaseSucessionalFilters {
  nome?: string
  order?: {
    column: 'id' | 'nome'
    direction: 'asc' | 'desc'
  }
}

export interface FaseSucessionalCollection {
  findAll(filters: FaseSucessionalFilters): Promise<Either<Error, FaseSucessional[]>>
  findById(id: string): Promise<Either<Error, FaseSucessional | undefined>>
  findByNome(nome: string): Promise<Either<Error, FaseSucessional | undefined>>
  create(attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, FaseSucessional>>
  update(id: string, attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, FaseSucessional | undefined>>
  delete(id: string): Promise<Either<Error, boolean>>
}
