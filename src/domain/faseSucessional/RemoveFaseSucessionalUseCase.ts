import { Either } from '@/library/either/Either'

import { FaseSucessionalNaoEncontradoError } from './error/FaseSucessionalNaoEncontradoError'
import { FaseSucessionalCollection } from './FaseSucessionalCollection'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

export class RemoveFaseSucessionalUseCase {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const existing = await this.faseSucessionalCollection.findById(id)
    if (existing.left()) {
      return existing
    }

    if (!existing.value) {
      return Either.left(new FaseSucessionalNaoEncontradoError())
    }

    const deleted = await this.faseSucessionalCollection.delete(id)
    if (deleted.left()) {
      return deleted
    }

    if (!deleted.value) {
      return Either.left(new FaseSucessionalNaoEncontradoError())
    }

    return Either.right(true)
  }
}
