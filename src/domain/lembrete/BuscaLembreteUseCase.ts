import { Either } from '@/library/either/Either'

import { Attributes } from './Lembrete'
import { LembreteCollection } from './LembreteCollection'

interface Dependencies {
  lembreteCollection: LembreteCollection
}

export class BuscaLembreteUseCase {
  private readonly lembreteCollection: LembreteCollection

  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
  }

  execute({ id }: { id: number }): Promise<Either<Error, Attributes | null>> {
    return this.lembreteCollection.findById(id)
  }
}
