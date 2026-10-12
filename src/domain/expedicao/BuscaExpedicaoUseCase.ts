import { Either } from '@/library/either/Either'

import { Attributes } from './Expedicao'
import { ExpedicaoCollection } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class BuscaExpedicaoUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  async execute({ id }: { id: number }): Promise<Either<Error, Attributes | null>> {
    return this.expedicaoCollection.findById(id)
  }
}
