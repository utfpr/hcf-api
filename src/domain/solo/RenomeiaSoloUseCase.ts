import { Either } from '@/library/either/Either'

import { Attributes } from './Solo'
import { SoloCollection } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

export class RenomeiaSoloUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  execute({ id, nome }: { id: number; nome: string }): Promise<Either<Error, Attributes | null>> {
    return this.soloCollection.update(id, { nome })
  }
}
