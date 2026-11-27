import { Either } from '@/library/either/Either'

import { Attributes, Solo } from './Solo'

/**
 * Critérios de ordenação para listagem de solos.
 */
export interface SoloOrder {
  column: 'id' | 'nome'
  direction: 'asc' | 'desc'
}

/**
 * Filtros suportados para consulta de tipos de solo.
 */
export interface SoloFilters {
  nome?: string
  order?: SoloOrder
}

/**
 * Contrato da coleção de persistência de solos.
 */
export interface SoloCollection {
  /**
   * Lista todos os tipos de solo com base nos filtros e ordenação fornecidos.
   *
   * @param filters Critérios de filtro e ordenação.
   * @returns Either com array de atributos dos solos encontrados ou erro de persistência.
   */
  findAll(filters: SoloFilters): Promise<Either<Error, Attributes[]>>

  /**
   * Busca um tipo de solo pelo seu identificador primário.
   *
   * @param id Identificador do solo.
   * @returns Either com atributos do solo ou undefined se inexistente, ou erro de persistência.
   */
  findById(id: number): Promise<Either<Error, Attributes | undefined>>

  /**
   * Busca um tipo de solo pelo nome exato.
   *
   * @param nome Nome do solo.
   * @returns Either com entidade Solo encontrada ou undefined se inexistente, ou erro de persistência.
   */
  findByNome(nome: string): Promise<Either<Error, Solo | undefined>>

  /**
   * Insere um novo tipo de solo na base de dados.
   *
   * @param data Atributos necessários para cadastro.
   * @returns Either com a entidade Solo persistida ou erro de persistência.
   */
  create(data: Pick<Attributes, 'nome'>): Promise<Either<Error, Solo>>

  /**
   * Atualiza o nome de um solo existente.
   *
   * @param id Identificador do solo a ser atualizado.
   * @param data Novos atributos para atualização.
   * @returns Either com a entidade Solo atualizada, undefined se não encontrado, ou erro de persistência.
   */
  update(id: number, data: Pick<Attributes, 'nome'>): Promise<Either<Error, Solo | undefined>>

  /**
   * Remove um solo pelo seu identificador.
   *
   * @param id Identificador do solo.
   * @returns Either com boolean indicando se houve deleção ou erro de persistência/restrição relacional.
   */
  delete(id: number): Promise<Either<Error, boolean>>
}
