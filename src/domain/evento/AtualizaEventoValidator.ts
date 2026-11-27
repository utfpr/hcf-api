import { Either } from '@/library/either/Either'

import {
  Attributes, ColetaAttributes, Evento, EventoTipo
} from './Evento'

/**
 * Conjunto de campos editáveis na atualização de um evento.
 */
export interface AtualizaEventoInput {
  tipo?: EventoTipo
  data_captura?: Date
  latitude?: number | null
  longitude?: number | null
  altitude?: number | null
  observacoes?: string | null
  coleta?: ColetaAttributes | null
  updated_by: number | null
}

/**
 * Validador responsável por aplicar as regras de coerência entre o tipo do evento e a ficha de coleta:
 * - vira DIARIO -> a ficha é descartada, não importa o que o cliente enviou;
 * - vira/permanece COLETA sem 'coleta' no corpo -> preserva a ficha preexistente;
 * - vira/permanece COLETA com 'coleta' no corpo -> substitui a ficha.
 */
export class AtualizaEventoValidator {
  /**
   * Mescla os dados atuais do evento com o patch de atualização e valida a consistência final da entidade.
   *
   * @param atual Estado atual persistido do evento.
   * @param input Alterações solicitadas na requisição.
   * @returns Either com a entidade Evento validada ou Error caso as regras de domínio sejam violadas.
   */
  validar(atual: Attributes, input: AtualizaEventoInput): Either<Error, Evento> {
    const mesclado = this.mesclar(atual, input)
    return Evento.create(mesclado)
  }

  private mesclar(atual: Attributes, input: AtualizaEventoInput): Attributes {
    const tipo = input.tipo ?? atual.tipo

    const coleta = tipo === 'DIARIO'
      ? null
      : (input.coleta !== undefined ? input.coleta : atual.coleta)

    return {
      ...atual,
      altitude: input.altitude !== undefined ? input.altitude : atual.altitude,
      data_captura: input.data_captura ?? atual.data_captura,
      coleta,
      latitude: input.latitude !== undefined ? input.latitude : atual.latitude,
      longitude: input.longitude !== undefined ? input.longitude : atual.longitude,
      observacoes: input.observacoes !== undefined ? input.observacoes : atual.observacoes,
      tipo,
      updated_by: input.updated_by
    }
  }
}
