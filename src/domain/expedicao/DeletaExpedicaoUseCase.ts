import {
  Either
} from '@/library/either/Either'

import { ExpedicaoCollection } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class DeletaExpedicaoUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection
  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  async execute({ id }: { id: number }): Promise<Either<Error, void>> {
    return this.expedicaoCollection.delete(id)
  }
}
