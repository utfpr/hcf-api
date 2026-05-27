import { Either } from '@/library/either/Either'

import { Attributes } from './Pais'

export interface PaisFilters {
  nome?: string
}

export interface EstadoDoPaisAttributes {
  id: number
  nome: string
  sigla: string
}

export interface PaisCollection {
  findAll(filters: PaisFilters): Promise<Either<Error, Attributes[]>>
  findEstadosBySigla(params: { sigla: string }): Promise<Either<Error, EstadoDoPaisAttributes[]>>
}
