import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, Evento
} from './Evento'
import { EventoCollection } from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
}

export class CriarEventoUseCase {
  private readonly eventoCollection: EventoCollection

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
  }

  async execute(input: CreateAttributes): Promise<Either<Error, Attributes>> {
    // Evento.create() exige um Attributes completo, usado para validar 
    // a coerência de negócio (tipo/ficha, coordenadas,capturado_em).
    const validated = Evento.create({
      ...input,
      created_at: new Date(),
      id: 0,
      updated_at: new Date(),
      updated_by: input.created_by
    })

    if (validated.left()) {
      return Either.left(validated.value)
    }

    return this.eventoCollection.create(input)
  }
}
