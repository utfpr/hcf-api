import { Either } from '@/library/either/Either'

import { FaseSucessionalCollection } from './FaseSucessionalCollection'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

export class RemoveFaseSucessionalUseCase {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    return this.faseSucessionalCollection.delete(id)
  }
}
