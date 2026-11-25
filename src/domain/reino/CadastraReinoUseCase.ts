import { Either } from '@/library/either/Either'

import { Reino } from './Reino'
import { ReinoCollection } from './ReinoCollection'

interface Dependencies {
  reinoCollection: ReinoCollection
}

export class CadastraReinoUseCase {
  private readonly reinoCollection: ReinoCollection

  constructor(dependencies: Dependencies) {
    this.reinoCollection = dependencies.reinoCollection
  }

  async execute({ nome }: { nome: string }): Promise<Either<Error, Reino>> {
    const reino = Reino.create({ nome })
    if (reino.left()) {
      return reino
    }

    return this.reinoCollection.create({ nome: reino.value.nome })
  }
}
