import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, UpdateAttributes
} from './Lembrete'

export interface LembreteOrder {
  column: 'id' | 'data_coleta'
  direction: 'asc' | 'desc'
}

export interface LembreteFilters {
  data_coleta_de?: string
  data_coleta_ate?: string
  order?: LembreteOrder
  limite?: number
  pagina?: number
}

export interface Paginated<T> {
  itens: T[]
  total: number
  limite: number
  pagina: number
}

export interface LembreteCollection {
  findAll(filters: LembreteFilters): Promise<Either<Error, Paginated<Attributes>>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>
  update(id: number, attributes: UpdateAttributes): Promise<Either<Error, Attributes | null>>
  delete(id: number): Promise<Either<Error, boolean>>
}
