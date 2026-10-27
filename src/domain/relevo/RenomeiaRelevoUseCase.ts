import { Either } from '@/library/either/Either'

import { RelevoNaoEncontradoError } from './error/RelevoNaoEncontradoError'
import { Relevo } from './Relevo'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

export class RenomeiaRelevoUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  async execute({ id, nome }: { id: string; nome: string }): Promise<Either<Error, Relevo>> {
    const relevo = Relevo.create({ nome })
    if (relevo.left()) {
      return relevo
    }

    const updated = await this.relevoCollection.updateById(id, { nome: relevo.value.nome })
    if (updated.left()) {
      return Either.left(updated.value)
    }

    if (!updated.value) {
      return Either.left(new RelevoNaoEncontradoError())
    }

    return Either.right(updated.value)
  }
}
