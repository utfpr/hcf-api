import { Either } from '@/library/either/Either'
import { Attributes, CreateAttributes, UpdateAttributes } from './Expedicao'

export interface ExpedicaoOrder {
  column: 'id' | 'data_inicio' | 'data_fim'
  direction: 'asc' | 'desc'
}

export interface ExpedicaoFilters {
  cidade_id?: number
  usuario_id?: number
  data_inicio_de?: string
  data_fim_ate?: string
  order?: ExpedicaoOrder
  limite?: number
  pagina?: number
}

export interface Paginated<T> {
  itens: T[]
  total: number
  limite: number
  pagina: number
}

export interface ExpedicaoCollection {
  findAll(filters: ExpedicaoFilters): Promise<Either<Error, Paginated<Attributes>>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>
  delete(id: number): Promise<Either<Error, void>>
  update(id: number, attributes: UpdateAttributes): Promise<Either<Error, Attributes>>
}
