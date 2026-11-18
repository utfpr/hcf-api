import { Either } from '@/library/either/Either'

import { LocalColeta } from './LocalColeta'

export interface LocalColetaFilters {
  cidade_id?: string
  estado_id?: string
  pais_id?: string
  descricao?: string
  order?: LocalColetaOrder
  limite: number
  pagina: number
  getAll: boolean
}

export interface LocalColetaOrder {
  column: 'id' | 'descricao'
  direction: 'asc' | 'desc'
}

export interface LocalColetaCollection {
  findAll(filters: LocalColetaFilters): Promise<Either<Error, {
    total: number
    resultado: LocalColeta[]
  }>>
  findById(id: string): Promise<Either<Error, LocalColeta | undefined>>
}
