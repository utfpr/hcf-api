import { Either } from '@/library/either/Either'

import { Attributes } from './Estado'

/**
 * Filtros suportados para consulta de estados.
 */
export interface EstadoFilters {
  paisSigla?: string
}

/**
 * Contrato da coleção de persistência de estados federativos.
 */
export interface EstadoCollection {
  /**
   * Lista estados cadastrados filtrando opcionalmente pela sigla do país.
   *
   * @param filters Filtro por sigla do país.
   * @returns Either com array de atributos de estados ou erro de persistência.
   */
  findAll(filters: EstadoFilters): Promise<Either<Error, Attributes[]>>
}
