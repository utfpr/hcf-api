import { Either } from '@/library/either/Either'

import { Attributes } from './Solo'
import { SoloCollection } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

export class BuscarSoloPorIdUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  execute({ id }: { id: number }): Promise<Either<Error, Attributes | null>> {
    return this.soloCollection.findById(id)
  }
}
