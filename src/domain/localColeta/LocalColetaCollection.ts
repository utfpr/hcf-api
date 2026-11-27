import { Either } from '@/library/either/Either'

import { LocalColeta, LocalColetaAttributes } from './LocalColeta'

/**
 * Filtros suportados para consulta paginada de locais de coleta.
 */
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

/**
 * Critérios de ordenação para locais de coleta.
 */
export interface LocalColetaOrder {
  column: 'id' | 'descricao'
  direction: 'asc' | 'desc'
}

/**
 * Contrato da coleção de persistência de locais de coleta.
 */
export interface LocalColetaCollection {
  /**
   * Cria e persiste um novo local de coleta.
   *
   * @param attributes Atributos para cadastro.
   * @returns Either com o LocalColeta criado ou erro de persistência/duplicidade/referência.
   */
  create(attributes: LocalColetaAttributes): Promise<Either<Error, LocalColeta>>

  /**
   * Atualiza os atributos de um local de coleta existente.
   *
   * @param id Identificador do local de coleta.
   * @param attributes Novos atributos.
   * @returns Either com o LocalColeta atualizado, undefined se não encontrado, ou erro.
   */
  updateById(id: string, attributes: LocalColetaAttributes): Promise<Either<Error, LocalColeta | undefined>>

  /**
   * Remove um local de coleta pelo ID.
   *
   * @param id Identificador do local de coleta.
   * @returns Either com boolean indicando se houve exclusão ou erro.
   */
  deleteById(id: string): Promise<Either<Error, boolean>>

  /**
   * Conta quantos tombos referenciam o local de coleta para proteger integridade relacional.
   *
   * @param id Identificador do local de coleta.
   * @returns Either com contagem de referências ou erro.
   */
  countTomboReferences(id: string): Promise<Either<Error, number>>

  /**
   * Consulta locais de coleta aplicando filtros geográficos e paginação.
   *
   * @param filters Critérios de filtro e paginação.
   * @returns Either com objeto contendo total de registros e lista de resultados ou erro.
   */
  findAll(filters: LocalColetaFilters): Promise<Either<Error, {
    total: number
    resultado: LocalColeta[]
  }>>

  /**
   * Busca um local de coleta detalhado pelo seu ID.
   *
   * @param id Identificador do local de coleta.
   * @returns Either com a entidade LocalColeta ou undefined se inexistente.
   */
  findById(id: string): Promise<Either<Error, LocalColeta | undefined>>
}
