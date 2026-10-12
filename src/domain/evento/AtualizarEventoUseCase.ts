import { Either } from '@/library/either/Either'

import { AtualizarEventoInput, AtualizarEventoValidator } from './AtualizarEventoValidator'
import { Attributes } from './Evento'
import { AtualizarEventoAttributes, EventoCollection } from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
  atualizarEventoValidator?: AtualizarEventoValidator
}

export type Input = AtualizarEventoInput & { id: number }

/**
 * O PUT do agregado evento+ficha. A regra de coerência própria do update
 * (quando `tipo` da ficha muda), agora está em AtualizarEventoValidator.
 */
export class AtualizarEventoUseCase {
  private readonly eventoCollection: EventoCollection
  private readonly atualizarEventoValidator: AtualizarEventoValidator

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
    this.atualizarEventoValidator = dependencies.atualizarEventoValidator ?? new AtualizarEventoValidator()
  }

  async execute(input: Input): Promise<Either<Error, Attributes | null>> {
    const existente = await this.eventoCollection.findById(input.id)
    if (existente.left()) {
      return Either.left(existente.value)
    }

    if (!existente.value) {
      return Either.right(null)
    }

    const validado = this.atualizarEventoValidator.validar(existente.value, input)
    if (validado.left()) {
      return Either.left(validado.value)
    }

    const mesclado = validado.value

    const patch: AtualizarEventoAttributes = {
      altitude: mesclado.altitude,
      capturado_em: mesclado.capturado_em,
      coleta: mesclado.coleta,
      latitude: mesclado.latitude,
      longitude: mesclado.longitude,
      observacoes: mesclado.observacoes,
      tipo: mesclado.tipo,
      updated_by: mesclado.updated_by
    }

    return this.eventoCollection.update(input.id, patch)
  }
}
