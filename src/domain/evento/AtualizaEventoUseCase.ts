import { Either } from '@/library/either/Either'

import { AtualizaEventoInput, AtualizaEventoValidator } from './AtualizaEventoValidator'
import { Attributes } from './Evento'
import { AtualizaEventoAttributes, EventoCollection } from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
  atualizaEventoValidator?: AtualizaEventoValidator
}

export type Input = AtualizaEventoInput & { id: number }

/**
 * O PUT do agregado evento+ficha. A regra de coerência própria do update
 * (quando `tipo` da ficha muda), agora está em AtualizaEventoValidator.
 */
export class AtualizaEventoUseCase {
  private readonly eventoCollection: EventoCollection
  private readonly atualizaEventoValidator: AtualizaEventoValidator

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
    this.atualizaEventoValidator = dependencies.atualizaEventoValidator ?? new AtualizaEventoValidator()
  }

  async execute(input: Input): Promise<Either<Error, Attributes | null>> {
    const existente = await this.eventoCollection.findById(input.id)
    if (existente.left()) {
      return Either.left(existente.value)
    }

    if (!existente.value) {
      return Either.right(null)
    }

    const validado = this.atualizaEventoValidator.validar(existente.value, input)
    if (validado.left()) {
      return Either.left(validado.value)
    }

    const mesclado = validado.value

    const patch: AtualizaEventoAttributes = {
      altitude: mesclado.altitude,
      data_captura: mesclado.data_captura,
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
