import { Either } from '@/library/either/Either'

import { Attributes, Relevo } from './Relevo'

/**
 * Critérios de ordenação para listagem de relevos.
 */
export interface RelevoOrder {
  column: 'id' | 'nome'
  direction: 'asc' | 'desc'
}

/**
 * Filtros suportados para consulta de tipos de relevo.
 */
export interface RelevoFilters {
  nome?: string
  order?: RelevoOrder
}

/**
 * Contrato da coleção de persistência de relevos.
 */
export interface RelevoCollection {
  /**
   * Lista todos os relevos com base nos filtros e ordenação fornecidos.
   *
   * @param filters Critérios de filtro e ordenação.
   * @returns Either com array de atributos dos relevos ou erro de persistência.
   */
  findAll(filters: RelevoFilters): Promise<Either<Error, Attributes[]>>

  /**
   * Busca um tipo de relevo pelo seu identificador primário.
   *
   * @param id Identificador em string do relevo.
   * @returns Either com atributos do relevo ou undefined se não encontrado.
   */
  findById(id: string): Promise<Either<Error, Attributes | undefined>>

  /**
   * Insere um novo tipo de relevo na base de dados.
   *
   * @param attributes Atributos necessários para cadastro.
   * @returns Either com a entidade Relevo persistida ou erro de persistência.
   */
  create(attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Relevo>>

  /**
   * Atualiza o nome de um relevo existente.
   *
   * @param id Identificador do relevo.
   * @param attributes Novos atributos do relevo.
   * @returns Either com a entidade Relevo atualizada ou undefined se inexistente.
   */
  updateById(id: string, attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Relevo | undefined>>

  /**
   * Remove um relevo pelo seu identificador.
   *
   * @param id Identificador do relevo a ser removido.
   * @returns Either com boolean indicando se houve remoção ou erro de persistência.
   */
  deleteById(id: string): Promise<Either<Error, boolean>>

  /**
   * Conta a quantidade de tombos associados ao tipo de relevo.
   * Usado para garantir integridade referencial antes da exclusão.
   *
   * @param id Identificador do relevo.
   * @returns Either com a quantidade de referências encontradas ou erro de persistência.
   */
  countTomboReferences(id: string): Promise<Either<Error, number>>
}
