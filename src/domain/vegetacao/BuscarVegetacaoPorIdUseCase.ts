import { Either } from '@/library/either/Either'

import { Attributes } from './Vegetacao'
import { VegetacaoCollection } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

export class BuscarVegetacaoPorIdUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  execute({ id }: { id: number }): Promise<Either<Error, Attributes | null>> {
    return this.vegetacaoCollection.findById(id)
  }
}
