import { Either } from '@/library/either/Either'

import { Attributes } from './FaseSucessional'
import { FaseSucessionalCollection } from './FaseSucessionalCollection'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

export class RenomeiaFaseSucessionalUseCase {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  execute({ id, nome }: { id: number; nome: string }): Promise<Either<Error, Attributes | null>> {
    return this.faseSucessionalCollection.update(id, { nome })
  }
}
