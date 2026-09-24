import { Either } from '@/library/either/Either'

import { Attributes } from './Evento'
import {
  EventoCollection, EventoFilters, Paginated
} from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
}

export class ListaEventosUseCase {
  private readonly eventoCollection: EventoCollection

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
  }

  execute(filters: EventoFilters): Promise<Either<Error, Paginated<Attributes>>> {
    return this.eventoCollection.findAll(filters)
  }
}
