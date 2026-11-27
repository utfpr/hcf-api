import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, UpdateAttributes, RotaInput
} from './Expedicao'

/**
 * Opções de ordenação para consultas de expedições.
 */
export interface ExpedicaoOrder {
  column: 'id' | 'data_inicio' | 'data_fim'
  direction: 'asc' | 'desc'
}

/**
 * Filtros de consulta e paginação para listagem de expedições.
 */
export interface ExpedicaoFilters {
  pagina?: number
  limite?: number
  cidade_id?: number
  usuario_id?: number
  data_inicio_de?: string
  data_inicio_ate?: string
  data_fim_de?: string
  data_fim_ate?: string
  order?: ExpedicaoOrder
}

/**
 * Estrutura genérica de paginação para itens de expedição.
 */
export interface Paginated<T> {
  itens: T[]
  total: number
  limite: number
  pagina: number
}

/**
 * Dados resumidos de participante para visualização em listagem.
 */
export interface ParticipanteExpedicao {
  id: number
  nome: string
}

/**
 * Item de retorno da listagem de expedições enriquecido com dados da cidade, participantes e rotas.
 */
export interface ExpedicaoListItem extends Attributes {
  cidade_nome: string | null
  estado_sigla: string | null
  participantes: ParticipanteExpedicao[]
  rotas: number[] // array de IDs
}

/**
 * Contrato de repositório para persistência e operações de agregado sobre Expedições.
 */
export interface ExpedicaoCollection {
  /**
   * Lista expedições de acordo com os filtros de data, local e paginação.
   *
   * @param filters Filtros de busca.
   * @returns Either com resultado paginado de expedições ou erro de infraestrutura.
   */
  findAll(filters: ExpedicaoFilters): Promise<Either<Error, Paginated<ExpedicaoListItem>>>

  /**
   * Busca os detalhes de uma expedição pelo seu identificador único.
   *
   * @param id Identificador da expedição.
   * @returns Either com a expedição encontrada (ou null se inexistente) ou erro de infraestrutura.
   */
  findById(id: number): Promise<Either<Error, Attributes | null>>

  /**
   * Persiste uma nova expedição com participantes e rotas associadas.
   *
   * @param attributes Dados para criação da expedição.
   * @returns Either com a Expedicao criada ou erro de infraestrutura.
   */
  create(attributes: CreateAttributes): Promise<Either<Error, Attributes>>

  /**
   * Vincula um usuário participante à expedição.
   *
   * @param expedicaoId ID da expedição.
   * @param usuarioId ID do usuário a adicionar.
   * @param createdBy ID do usuário que executou a ação.
   * @returns Either void indicando sucesso ou erro (ex.: participante duplicado).
   */
  addParticipant(expedicaoId: number, usuarioId: number, createdBy?: number | null): Promise<Either<Error, void>>

  /**
   * Remove o vínculo de um participante com a expedição.
   *
   * @param expedicaoId ID da expedição.
   * @param usuarioId ID do usuário a desvincular.
   * @returns Either void indicando sucesso ou erro de infraestrutura.
   */
  removeParticipant(expedicaoId: number, usuarioId: number): Promise<Either<Error, void>>

  /**
   * Verifica se determinado usuário participa da expedição informada.
   *
   * @param expedicaoId ID da expedição.
   * @param usuarioId ID do usuário.
   * @returns Either com booleano de participação ou erro de infraestrutura.
   */
  isParticipant(expedicaoId: number, usuarioId: number): Promise<Either<Error, boolean>>

  /**
   * Substitui atomicamente as rotas e locais de coleta vinculados à expedição.
   *
   * @param expedicaoId ID da expedição.
   * @param rotas Lista de novas rotas a serem persistidas.
   * @param updatedBy ID do usuário que alterou a rota.
   * @returns Either void indicando sucesso ou erro de infraestrutura/validação de localidade.
   */
  substituteRoute(expedicaoId: number, rotas: RotaInput[], updatedBy?: number | null): Promise<Either<Error, void>>

  /**
   * Remove a expedição do sistema.
   *
   * @param id ID da expedição a ser removida.
   * @returns Either void indicando sucesso ou erro de infraestrutura.
   */
  delete(id: number): Promise<Either<Error, void>>

  /**
   * Atualiza os campos cadastrais da expedição.
   *
   * @param id ID da expedição a atualizar.
   * @param attributes Campos alterados.
   * @returns Either com a expedição atualizada ou erro de infraestrutura.
   */
  update(id: number, attributes: UpdateAttributes): Promise<Either<Error, Attributes>>
}
