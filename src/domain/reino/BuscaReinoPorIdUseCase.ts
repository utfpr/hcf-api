import { Either } from '@/library/either/Either'

import { Attributes } from './Reino'
import { ReinoCollection } from './ReinoCollection'

interface Dependencies {
  reinoCollection: ReinoCollection
}

export class BuscaReinoPorIdUseCase {
  private readonly reinoCollection: ReinoCollection

  constructor(dependencies: Dependencies) {
    this.reinoCollection = dependencies.reinoCollection
  }

  execute({ id }: { id: string }): Promise<Either<Error, Attributes | undefined>> {
    return this.reinoCollection.findById(id)
  }
}
