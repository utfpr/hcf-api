import { Either } from '@/library/either/Either'

import { LocalColeta } from './LocalColeta'
import { LocalColetaCollection } from './LocalColetaCollection'

interface Dependencies {
  localColetaCollection: LocalColetaCollection
}

export class BuscaLocalColetaPorIdUseCase {
  private readonly localColetaCollection: LocalColetaCollection

  constructor(dependencies: Dependencies) {
    this.localColetaCollection = dependencies.localColetaCollection
  }

  execute(id: string): Promise<Either<Error, LocalColeta | undefined>> {
    return this.localColetaCollection.findById(id)
  }
}
