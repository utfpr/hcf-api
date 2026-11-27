import { Either } from '@/library/either/Either'

import { Attributes, FaseSucessional } from './FaseSucessional'

/**
 * Filtros suportados para consulta e listagem de fases sucessionais.
 */
export interface FaseSucessionalFilters {
  nome?: string
  order?: {
    column: 'id' | 'nome'
    direction: 'asc' | 'desc'
  }
}

/**
 * Contrato da coleção de persistência de fases sucessionais.
 */
export interface FaseSucessionalCollection {
  /**
   * Lista todas as fases sucessionais conforme filtros e ordenação informados.
   *
   * @param filters Filtros de busca e ordenação.
   * @returns Either com array de fases sucessionais ou erro de persistência.
   */
  findAll(filters: FaseSucessionalFilters): Promise<Either<Error, FaseSucessional[]>>

  /**
   * Busca uma fase sucessional pelo seu ID primário.
   *
   * @param id Identificador da fase sucessional.
   * @returns Either com a fase encontrada, undefined se inexistente, ou erro.
   */
  findById(id: string): Promise<Either<Error, FaseSucessional | undefined>>

  /**
   * Busca uma fase sucessional pelo nome exato.
   *
   * @param nome Nome da fase sucessional.
   * @returns Either com a entidade encontrada, undefined se inexistente, ou erro.
   */
  findByNome(nome: string): Promise<Either<Error, FaseSucessional | undefined>>

  /**
   * Insere uma nova fase sucessional no repositório.
   *
   * @param attributes Dados para cadastro da fase.
   * @returns Either com a entidade criada e persistida ou erro.
   */
  create(attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, FaseSucessional>>

  /**
   * Atualiza o nome de uma fase sucessional existente.
   *
   * @param id Identificador da fase sucessional.
   * @param attributes Novos atributos.
   * @returns Either com a fase atualizada, undefined se não encontrada, ou erro.
   */
  update(id: string, attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, FaseSucessional | undefined>>

  /**
   * Remove uma fase sucessional do repositório.
   *
   * @param id Identificador da fase a ser removida.
   * @returns Either com boolean indicando remoção ou erro de persistência/restrição.
   */
  delete(id: string): Promise<Either<Error, boolean>>
}
