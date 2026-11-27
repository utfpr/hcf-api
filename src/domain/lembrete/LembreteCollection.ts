import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, UpdateAttributes
} from './Lembrete'

/**
 * Opções de ordenação para consultas de lembretes.
 */
export interface LembreteOrder {
  column: 'id' | 'data_coleta'
  direction: 'asc' | 'desc'
}

/**
 * Filtros de consulta e paginação para listagem de lembretes.
 */
export interface LembreteFilters {
  expedicao_id?: number
  data_coleta_de?: string
  data_coleta_ate?: string
  order?: LembreteOrder
  limite?: number
  pagina?: number
}

/**
 * Estrutura paginada genérica para lembretes.
 */
export interface Paginated<T> {
  itens: T[]
  total: number
  limite: number
  pagina: number
}

/**
 * Contrato de repositório para persistência da entidade Lembrete.
 */
export interface LembreteCollection {
  /**
   * Consulta lembretes aplicando filtros de expedição, período e paginação.
   *
   * @param filters Critérios de filtro.
   * @returns Either com resultado paginado ou erro de infraestrutura.
   */
  findAll(filters: LembreteFilters): Promise<Either<Error, Paginated<Attributes>>>

  /**
   * Busca um lembrete pelo identificador numérico único.
   *
   * @param id ID do lembrete.
   * @returns Either com o Lembrete encontrado (ou null se inexistente) ou erro de infraestrutura.
   */
  findById(id: number): Promise<Either<Error, Attributes | null>>

  /**
   * Busca um lembrete pela chave de idempotência offline (`client_uuid`).
   *
   * @param clientUuid UUID gerado pelo cliente móvel.
   * @returns Either com o Lembrete encontrado (ou null se inexistente) ou erro de infraestrutura.
   */
  findByClientUuid(clientUuid: string): Promise<Either<Error, Attributes | null>>

  /**
   * Persiste um novo lembrete com sua ficha associada.
   *
   * @param attributes Atributos para criação.
   * @returns Either com os atributos do Lembrete criado ou erro de infraestrutura.
   */
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>

  /**
   * Atualiza dados cadastrais e ficha do lembrete.
   *
   * @param id ID do lembrete.
   * @param attributes Atributos alterados.
   * @returns Either com o Lembrete atualizado (ou null se não encontrado) ou erro de infraestrutura.
   */
  update(id: number, attributes: UpdateAttributes): Promise<Either<Error, Attributes | null>>

  /**
   * Remove o lembrete especificado pelo ID.
   *
   * @param id ID do lembrete a excluir.
   * @returns Either com booleano confirmando exclusão ou erro de infraestrutura.
   */
  delete(id: number): Promise<Either<Error, boolean>>
}
