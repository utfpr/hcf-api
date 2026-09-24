import { Either } from '@/library/either/Either'

import { EventoCollection } from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
}

export class RemoverEventoUseCase {
  private readonly eventoCollection: EventoCollection

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
  }

  execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    return this.eventoCollection.delete(id)
  }
}
