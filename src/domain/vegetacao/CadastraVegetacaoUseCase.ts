import { Either } from '@/library/either/Either'

import { Attributes } from './Vegetacao'
import { VegetacaoCollection } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

export class CadastraVegetacaoUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  execute({ nome }: { nome: string }): Promise<Either<Error, Attributes>> {
    return this.vegetacaoCollection.create({ nome })
  }
}
