import { Attributes } from '@/domain/pais/Pais'
import { Either } from '@/library/either/Either'

/**
 * Filtros suportados para consulta de países.
 */
export interface PaisFilters {
  nome?: string
}

/**
 * Contrato da coleção de persistência de países.
 */
export interface PaisCollection {
  /**
   * Lista países cadastrados conforme filtro de nome.
   *
   * @param filters Filtro de busca por nome.
   * @returns Either com array de atributos dos países ou erro de persistência.
   */
  findAll(filters: PaisFilters): Promise<Either<Error, Attributes[]>>
}
