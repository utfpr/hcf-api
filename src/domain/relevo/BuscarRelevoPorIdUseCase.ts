import { Either } from '@/library/either/Either'

import { Attributes } from './Relevo'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

export class BuscarRelevoPorIdUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  execute({ id }: { id: number }): Promise<Either<Error, Attributes | null>> {
    return this.relevoCollection.findById(id)
  }
}
