import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, EventoTipo
} from './Evento'

export interface EventoOrder {
  column: 'id' | 'capturado_em'
  direction: 'asc' | 'desc'
}

export interface EventoFilters {
  expedicao_id?: number
  tipo?: EventoTipo
  capturado_de?: Date
  capturado_ate?: Date
  order?: EventoOrder
  limite?: number
  pagina?: number
}

export interface Paginated<T> {
  itens: T[]
  total: number
  limite: number
  pagina: number
}

export interface EventoCollection {
  findAll(filters: EventoFilters): Promise<Either<Error, Paginated<Attributes>>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>
}
