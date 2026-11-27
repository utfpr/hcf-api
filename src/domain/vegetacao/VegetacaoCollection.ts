import { Either } from '@/library/either/Either'

import { Attributes, Vegetacao } from './Vegetacao'

/**
 * Critérios de ordenação para listagem de tipos de vegetação.
 */
export interface VegetacaoOrder {
  column: 'id' | 'nome'
  direction: 'asc' | 'desc'
}

/**
 * Filtros suportados para consulta de tipos de vegetação.
 */
export interface VegetacaoFilters {
  nome?: string
  order?: VegetacaoOrder
}

/**
 * Contrato da coleção de persistência de tipos de vegetação.
 */
export interface VegetacaoCollection {
  /**
   * Lista todos os tipos de vegetação com base nos filtros e ordenação fornecidos.
   *
   * @param filters Critérios de filtro e ordenação.
   * @returns Either com array de atributos ou erro de persistência.
   */
  findAll(filters: VegetacaoFilters): Promise<Either<Error, Attributes[]>>

  /**
   * Busca um tipo de vegetação pelo ID.
   *
   * @param id Identificador do tipo de vegetação.
   * @returns Either com atributos da vegetação, undefined se não encontrada, ou erro de persistência.
   */
  findById(id: string): Promise<Either<Error, Attributes | undefined>>

  /**
   * Cria um novo registro de vegetação.
   *
   * @param data Atributos para criação.
   * @returns Either com a entidade Vegetacao persistida ou erro de persistência/duplicidade.
   */
  create(data: Pick<Attributes, 'nome'>): Promise<Either<Error, Vegetacao>>

  /**
   * Atualiza os dados de um tipo de vegetação existente.
   *
   * @param id Identificador da vegetação.
   * @param data Novos atributos.
   * @returns Either com a entidade Vegetacao atualizada, undefined se não encontrada, ou erro.
   */
  update(id: string, data: Pick<Attributes, 'nome'>): Promise<Either<Error, Vegetacao | undefined>>

  /**
   * Remove um tipo de vegetação pelo identificador.
   *
   * @param id Identificador da vegetação.
   * @returns Either com boolean indicando se foi removida ou erro de persistência/restrição de chave estrangeira.
   */
  delete(id: string): Promise<Either<Error, boolean>>
}
