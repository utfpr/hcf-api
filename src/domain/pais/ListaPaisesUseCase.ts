import { Either } from '@/library/either/Either'

import { Attributes } from './Pais'
import { PaisCollection, PaisFilters } from './PaisCollection'

interface Dependencies {
  paisCollection: PaisCollection
}

export class ListaPaisesUseCase {
  private readonly paisCollection: PaisCollection

  constructor(dependencies: Dependencies) {
    this.paisCollection = dependencies.paisCollection
  }

  async execute(filters: PaisFilters): Promise<Either<Error, Attributes[]>> {
    return this.paisCollection.findAll(filters)
  }
}
