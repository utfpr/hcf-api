import { Either } from '@/library/either/Either'

import { Attributes } from './FaseSucessional'
import { FaseSucessionalCollection, FaseSucessionalFilters } from './FaseSucessionalCollection'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

export class ListaFasesSucessionaisUseCase {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  async execute(filters: FaseSucessionalFilters): Promise<Either<Error, Attributes[]>> {
    return this.faseSucessionalCollection.findAll(filters)
  }
}
