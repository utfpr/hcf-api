import { Either } from '@/library/either/Either'

import { ReinoNaoEncontradoError } from './error/ReinoNaoEncontradoError'
import { Reino } from './Reino'
import { ReinoCollection } from './ReinoCollection'

interface Dependencies {
  reinoCollection: ReinoCollection
}

export class RenomeiaReinoUseCase {
  private readonly reinoCollection: ReinoCollection

  constructor(dependencies: Dependencies) {
    this.reinoCollection = dependencies.reinoCollection
  }

  async execute({ id, nome }: { id: string; nome: string }): Promise<Either<Error, Reino>> {
    const reino = Reino.create({ nome })
    if (reino.left()) {
      return reino
    }

    const updated = await this.reinoCollection.updateById(id, { nome: reino.value.nome })
    if (updated.left()) {
      return Either.left(updated.value)
    }

    if (!updated.value) {
      return Either.left(new ReinoNaoEncontradoError())
    }

    return Either.right(updated.value)
  }
}
