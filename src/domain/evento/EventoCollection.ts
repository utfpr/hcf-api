import { Either } from '@/library/either/Either'

import {
  Attributes, ColetaAttributes, CreateAttributes, EventoTipo
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

export interface AtualizarEventoAttributes {
  tipo: EventoTipo
  capturado_em: Date
  latitude: number | null
  longitude: number | null
  altitude: number | null
  observacoes: string | null
  coleta: ColetaAttributes | null
  updated_by: number | null
}

export interface EventoCollection {
  findAll(filters: EventoFilters): Promise<Either<Error, Paginated<Attributes>>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>
  update(id: number, attributes: AtualizarEventoAttributes): Promise<Either<Error, Attributes | null>>
  delete(id: number): Promise<Either<Error, boolean>>
}
