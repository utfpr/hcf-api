import { Either } from '@/library/either/Either'

import { Attributes } from './Evento'
import { EventoCollection } from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
}

export class BuscarEventoPorIdUseCase {
  private readonly eventoCollection: EventoCollection

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
  }

  execute({ id }: { id: number }): Promise<Either<Error, Attributes | null>> {
    return this.eventoCollection.findById(id)
  }
}
