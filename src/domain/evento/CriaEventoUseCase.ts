import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, Evento
} from './Evento'
import { EventoCollection } from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
}

export class CriaEventoUseCase {
  private readonly eventoCollection: EventoCollection

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
  }

  async execute(input: CreateAttributes): Promise<Either<Error, Attributes>> {
    const validated = Evento.create(input)

    if (validated.left()) {
      return Either.left(validated.value)
    }

    return this.eventoCollection.create(input)
  }
}
