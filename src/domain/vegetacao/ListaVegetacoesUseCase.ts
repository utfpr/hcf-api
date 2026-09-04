import { Either } from '@/library/either/Either'

import { Attributes } from './Vegetacao'
import { VegetacaoCollection, VegetacaoFilters } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

export class ListaVegetacoesUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  execute(filters: VegetacaoFilters): Promise<Either<Error, Attributes[]>> {
    return this.vegetacaoCollection.findAll(filters)
  }
}
