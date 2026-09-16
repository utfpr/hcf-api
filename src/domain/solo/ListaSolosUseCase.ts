import { Either } from '@/library/either/Either'

import { Attributes } from './Solo'
import { SoloCollection, SoloFilters } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

export class ListaSolosUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  execute(filters: SoloFilters): Promise<Either<Error, Attributes[]>> {
    return this.soloCollection.findAll(filters)
  }
}
