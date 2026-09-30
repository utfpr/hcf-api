import { Either } from '@/library/either/Either'

import { Attributes } from './Solo'
import { SoloCollection } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

export class CadastraSoloUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  execute({ nome }: { nome: string }): Promise<Either<Error, Attributes>> {
    return this.soloCollection.create({ nome })
  }
}
