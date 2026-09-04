import { Either } from '@/library/either/Either'

import { Attributes } from './FaseSucessional'
import { FaseSucessionalCollection } from './FaseSucessionalCollection'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

export class BuscaFaseSucessionalUseCase {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  async execute({ id }: { id: number }): Promise<Either<Error, Attributes | null>> {
    return this.faseSucessionalCollection.findById(id)
  }
}
