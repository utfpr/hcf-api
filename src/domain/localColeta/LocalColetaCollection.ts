import { Either } from '@/library/either/Either'

import { LocalColeta, LocalColetaAttributes } from './LocalColeta'

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
  create(attributes: LocalColetaAttributes): Promise<Either<Error, LocalColeta>>
  updateById(id: string, attributes: LocalColetaAttributes): Promise<Either<Error, LocalColeta | undefined>>
  deleteById(id: string): Promise<Either<Error, boolean>>
  countTomboReferences(id: string): Promise<Either<Error, number>>
  findAll(filters: LocalColetaFilters): Promise<Either<Error, {
    total: number
    resultado: LocalColeta[]
  }>>
  findById(id: string): Promise<Either<Error, LocalColeta | undefined>>
}
