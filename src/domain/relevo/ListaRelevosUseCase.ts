import { Either } from '@/library/either/Either'

import { Attributes } from './Relevo'
import { RelevoCollection, RelevoFilters } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

export class ListaRelevosUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  execute(filters: RelevoFilters): Promise<Either<Error, Attributes[]>> {
    return this.relevoCollection.findAll(filters)
  }
}
