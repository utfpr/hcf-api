import { Either } from '@/library/either/Either'

import {
  Attributes, ColetaAttributes, Evento, EventoTipo
} from './Evento'

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
 * Regra de coerência própria do update, `tipo` e `coleta` não são independentes:
 * - vira DIARIO -> a ficha é descartada, não importa o que o cliente mandou
 * - vira COLETA sem `coleta` no corpo -> mantém a ficha atual
 * - vira COLETA com `coleta` no corpo -> substitui a ficha
 *
 * Reaproveita de Evento.create() para checagem final de coerência (tipo/ficha,
 * coordenadas, data_captura) sobre o estado já mesclado, afim não duplicar
 * essa regra em dois lugares.
 */

export class AtualizaEventoValidator {
  validar(atual: Attributes, input: AtualizaEventoInput): Either<Error, Attributes> {
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
