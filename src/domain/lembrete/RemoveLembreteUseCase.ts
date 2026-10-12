import { Either } from '@/library/either/Either'

import { LembreteCollection } from './LembreteCollection'

interface Dependencies {
  lembreteCollection: LembreteCollection
}

export class RemoveLembreteUseCase {
  private readonly lembreteCollection: LembreteCollection

  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
  }

  execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    return this.lembreteCollection.delete(id)
  }
}
