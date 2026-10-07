import { Either } from '@/library/either/Either'

import { RelevoEmUsoError } from './error/RelevoEmUsoError'
import { RelevoNaoEncontradoError } from './error/RelevoNaoEncontradoError'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

export class RemoveRelevoUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const existing = await this.relevoCollection.findById(id)
    if (existing.left()) {
      return existing
    }

    if (!existing.value) {
      return Either.left(new RelevoNaoEncontradoError())
    }

    const used = await this.relevoCollection.countTomboReferences(id)
    if (used.left()) {
      return used
    }

    if (used.value > 0) {
      return Either.left(new RelevoEmUsoError())
    }

    const deleted = await this.relevoCollection.deleteById(id)
    if (deleted.left()) {
      return deleted
    }

    if (!deleted.value) {
      return Either.left(new RelevoNaoEncontradoError())
    }

    return Either.right(deleted.value)
  }
}
