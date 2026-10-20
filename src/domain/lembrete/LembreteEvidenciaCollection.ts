import { Either } from '@/library/either/Either'

import { Attributes, CreateAttributes } from './LembreteEvidencia'

export interface LembreteEvidenciaFilters {
  lembrete_id?: number
}

export interface LembreteEvidenciaCollection {
  findAll(filters: LembreteEvidenciaFilters): Promise<Either<Error, Attributes[]>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
  findByClientUuid(clientUuid: string): Promise<Either<Error, Attributes | null>>
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>
  delete(id: number): Promise<Either<Error, boolean>>
}
