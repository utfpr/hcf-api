import { Either } from '@/library/either/Either'

import { Relevo } from './Relevo'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

export class CadastraRelevoUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  async execute({ nome }: { nome: string }): Promise<Either<Error, Relevo>> {
    const relevo = Relevo.create({ nome })
    if (relevo.left()) {
      return relevo
    }

    return this.relevoCollection.create({ nome: relevo.value.nome })
  }
}
