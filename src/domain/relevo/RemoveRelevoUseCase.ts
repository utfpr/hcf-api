import { Either } from '@/library/either/Either'

import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

export class RemoveRelevoUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  async execute({ id }: { id: number }): Promise<Either<Error, boolean | null>> {
    const existing = await this.relevoCollection.findById(id)
    if (existing.left()) {
      return existing
    }

    if (!existing.value) {
      return Either.right(null)
    }

    const used = await this.relevoCollection.countTomboReferences(id)
    if (used.left()) {
      return used
    }

    if (used.value > 0) {
      return Either.left(new Error('Relevo está em uso em tombos e não pode ser removido'))
    }

    return this.relevoCollection.deleteById(id)
  }
}
