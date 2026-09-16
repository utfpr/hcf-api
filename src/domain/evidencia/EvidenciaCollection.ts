import { Either } from '@/library/either/Either'

import { Attributes, CreateAttributes } from './Evidencia'

export interface EvidenciaOrder {
  column: 'id' | 'nome' | 'capturado_em'
  direction: 'asc' | 'desc'
}

export interface EvidenciaFilters {
  evento_id?: number
  nome?: string
  order?: EvidenciaOrder
}

export interface EvidenciaCollection {
  findAll(filters: EvidenciaFilters): Promise<Either<Error, Attributes[]>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>
}
