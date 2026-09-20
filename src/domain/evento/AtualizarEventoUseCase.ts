import { Either } from '@/library/either/Either'

import {
  Attributes, ColetaAttributes, Evento, EventoTipo
} from './Evento'
import { AtualizarEventoAttributes, EventoCollection } from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
}

export interface Input {
  id: number
  tipo?: EventoTipo
  capturado_em?: Date
  latitude?: number | null
  longitude?: number | null
  altitude?: number | null
  observacoes?: string | null
  coleta?: ColetaAttributes | null
  updated_by: number | null
}

/**
 * O PUT do agregado evento+ficha. `tipo` e `coleta` não são independentes:
 * - vira DIARIO -> a ficha é descartada, não importa o que o cliente mandou
 * - vira COLETA sem `coleta` no corpo -> mantém a ficha atual
 * - vira COLETA com `coleta` no corpo -> substitui a ficha
 *
 * A coerência do estado final é validada reaproveitando Evento.create() sobre
 * o objeto já mesclado — é a mesma regra usada na criação, só que aplicada
 * depois do merge em vez de sobre um payload novo.
 */
export class AtualizarEventoUseCase {
  private readonly eventoCollection: EventoCollection

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
  }

  async execute(input: Input): Promise<Either<Error, Attributes | null>> {
    const existente = await this.eventoCollection.findById(input.id)
    if (existente.left()) {
      return Either.left(existente.value)
    }

    if (!existente.value) {
      return Either.right(null)
    }

    const merged = this.merge(existente.value, input)

    const validated = Evento.create(merged)
    if (validated.left()) {
      return Either.left(validated.value)
    }

    const patch: AtualizarEventoAttributes = {
      altitude: merged.altitude,
      capturado_em: merged.capturado_em,
      coleta: merged.coleta,
      latitude: merged.latitude,
      longitude: merged.longitude,
      observacoes: merged.observacoes,
      tipo: merged.tipo,
      updated_by: merged.updated_by
    }

    return this.eventoCollection.update(input.id, patch)
  }

  private merge(atual: Attributes, input: Input): Attributes {
    const tipo = input.tipo ?? atual.tipo

    // Trocar para DIARIO descarta a ficha por definição, mesmo que o
    // cliente não tenha mandado `coleta` no corpo do PUT.
    const coleta = tipo === 'DIARIO'
      ? null
      : (input.coleta !== undefined ? input.coleta : atual.coleta)

    return {
      ...atual,
      altitude: input.altitude !== undefined ? input.altitude : atual.altitude,
      capturado_em: input.capturado_em ?? atual.capturado_em,
      coleta,
      latitude: input.latitude !== undefined ? input.latitude : atual.latitude,
      longitude: input.longitude !== undefined ? input.longitude : atual.longitude,
      observacoes: input.observacoes !== undefined ? input.observacoes : atual.observacoes,
      tipo,
      updated_by: input.updated_by
    }
  }
}
