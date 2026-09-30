import { Either } from '@/library/either/Either'

import { Attributes } from './FaseSucessional'
import { FaseSucessionalCollection } from './FaseSucessionalCollection'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

export class CadastraFaseSucessionalUseCase {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  execute({ nome }: { nome: string }): Promise<Either<Error, Attributes>> {
    return this.faseSucessionalCollection.create({ nome })
  }
}
