import { Either } from '@/library/either/Either'

import {
  Attributes, ColetaAttributes, CreateAttributes, EventoTipo
} from './Evento'

/**
 * Opções de ordenação para listagem de eventos.
 */
export interface EventoOrder {
  column: 'id' | 'data_captura'
  direction: 'asc' | 'desc'
}

/**
 * Filtros de consulta e paginação aplicáveis na listagem de eventos.
 */
export interface EventoFilters {
  expedicao_id?: number
  tipo?: EventoTipo
  data_captura_de?: Date
  data_captura_ate?: Date
  order?: EventoOrder
  limite?: number
  pagina?: number
}

/**
 * Estrutura paginada genérica para retorno de coleções de dados.
 */
export interface Paginated<T> {
  itens: T[]
  total: number
  limite: number
  pagina: number
}

/**
 * Conjunto de atributos persistíveis na operação de atualização de um evento.
 */
export interface AtualizaEventoAttributes {
  tipo: EventoTipo
  data_captura: Date
  latitude: number | null
  longitude: number | null
  altitude: number | null
  observacoes: string | null
  coleta: ColetaAttributes | null
  updated_by: number | null
}

/**
 * Contrato de repositório para persistência e consulta da entidade Evento.
 */
export interface EventoCollection {
  /**
   * Consulta eventos com filtros opcionais por expedição, período, tipo e suporte a paginação.
   *
   * @param filters Critérios de filtro e paginação.
   * @returns Either com resultado paginado de eventos ou erro de infraestrutura.
   */
  findAll(filters: EventoFilters): Promise<Either<Error, Paginated<Attributes>>>

  /**
   * Busca um evento pelo identificador numérico único.
   *
   * @param id Identificador numérico do evento.
   * @returns Either com o Evento encontrado (ou null se inexistente) ou erro de infraestrutura.
   */
  findById(id: number): Promise<Either<Error, Attributes | null>>

  /**
   * Busca um evento pela chave de idempotência offline (`client_uuid`).
   *
   * @param clientUuid UUID único gerado pelo cliente móvel.
   * @returns Either com o Evento encontrado (ou null se inexistente) ou erro de infraestrutura.
   */
  findByClientUuid(clientUuid: string): Promise<Either<Error, Attributes | null>>

  /**
   * Insere um novo registro de evento e sua respectiva ficha de coleta.
   *
   * @param attributes Dados para criação do evento.
   * @returns Either com os atributos do evento persistido ou erro de infraestrutura.
   */
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>

  /**
   * Atualiza os dados de um evento existente e sincroniza a ficha de coleta.
   *
   * @param id Identificador do evento a atualizar.
   * @param attributes Dados alterados do evento.
   * @returns Either com o evento atualizado (ou null se não encontrado) ou erro de infraestrutura.
   */
  update(id: number, attributes: AtualizaEventoAttributes): Promise<Either<Error, Attributes | null>>

  /**
   * Remove o evento especificado pelo ID.
   *
   * @param id Identificador do evento a ser removido.
   * @returns Either com booleano confirmando exclusão ou erro de infraestrutura.
   */
  delete(id: number): Promise<Either<Error, boolean>>
}
