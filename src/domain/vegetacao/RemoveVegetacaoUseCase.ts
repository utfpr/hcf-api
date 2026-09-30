import { Either } from '@/library/either/Either'

import { VegetacaoCollection } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

export class RemoveVegetacaoUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    return this.vegetacaoCollection.delete(id)
  }
}
