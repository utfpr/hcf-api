import { Either } from '@/library/either/Either'

import { Attributes, CreateAttributes } from './Evidencia'

/**
 * Opções de ordenação para consultas de evidências.
 */
export interface EvidenciaOrder {
  column: 'id' | 'nome' | 'data_captura'
  direction: 'asc' | 'desc'
}

/**
 * Filtros de busca para listagem de evidências.
 */
export interface EvidenciaFilters {
  evento_id?: number
  nome?: string
  order?: EvidenciaOrder
}

/**
 * Contrato de repositório para persistência de metadados de evidências botânicas.
 */
export interface EvidenciaCollection {
  /**
   * Consulta evidências com base em filtros como evento_id e ordenação.
   *
   * @param filters Filtros de busca.
   * @returns Either com a lista de evidências ou erro de infraestrutura.
   */
  findAll(filters: EvidenciaFilters): Promise<Either<Error, Attributes[]>>

  /**
   * Busca uma evidência pelo seu identificador numérico único.
   *
   * @param id Identificador da evidência.
   * @returns Either com a evidência encontrada (ou null se inexistente) ou erro de infraestrutura.
   */
  findById(id: number): Promise<Either<Error, Attributes | null>>

  /**
   * Busca uma evidência pela chave de idempotência offline (`client_uuid`).
   *
   * @param clientUuid UUID gerado pelo cliente móvel.
   * @returns Either com a evidência encontrada (ou null se inexistente) ou erro de infraestrutura.
   */
  findByClientUuid(clientUuid: string): Promise<Either<Error, Attributes | null>>

  /**
   * Insere um novo registro de metadados de evidência no banco de dados.
   *
   * @param attributes Dados para criação da evidência.
   * @returns Either com a evidência persistida ou erro de infraestrutura.
   */
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>

  /**
   * Remove o registro de metadados da evidência no banco.
   *
   * @param id Identificador numérico da evidência.
   * @returns Either com booleano confirmando exclusão ou erro de infraestrutura.
   */
  delete(id: number): Promise<Either<Error, boolean>>
}
