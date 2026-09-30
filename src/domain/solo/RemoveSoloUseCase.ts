import { Either } from '@/library/either/Either'

import { SoloCollection } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

export class RemoveSoloUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    return this.soloCollection.delete(id)
  }
}
