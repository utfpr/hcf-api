import { Either } from '@/library/either/Either'

import { Attributes } from './Reino'
import { ReinoCollection, ReinoFilters } from './ReinoCollection'

interface Dependencies {
  reinoCollection: ReinoCollection
}

export class ListaReinosUseCase {
  private readonly reinoCollection: ReinoCollection

  constructor(dependencies: Dependencies) {
    this.reinoCollection = dependencies.reinoCollection
  }

  execute(filters: ReinoFilters): Promise<Either<Error, Attributes[]>> {
    return this.reinoCollection.findAll(filters)
  }
}
