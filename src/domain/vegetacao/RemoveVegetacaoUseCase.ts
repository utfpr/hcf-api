import { Either } from '@/library/either/Either'
import { NotFoundError } from '@/library/http/error/NotFoundError'

import { VegetacaoCollection } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

export class RemoveVegetacaoUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const deleted = await this.vegetacaoCollection.delete(id)
    if (deleted.left()) {
      return Either.left(deleted.value)
    }

    if (!deleted.value) {
      return Either.left(new NotFoundError({ message: 'Vegetação não encontrada' }))
    }

    return Either.right(deleted.value)
  }
}
