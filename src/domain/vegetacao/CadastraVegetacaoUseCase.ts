import { Either } from '@/library/either/Either'

import { Attributes, Vegetacao } from './Vegetacao'
import { VegetacaoCollection } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

export class CadastraVegetacaoUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  async execute({ nome }: { nome: string }): Promise<Either<Error, Attributes>> {
    const vegetacao = Vegetacao.create({ nome })
    if (vegetacao.left()) {
      return Either.left(vegetacao.value)
    }

    return this.vegetacaoCollection.create({ nome: vegetacao.value.nome })
  }
}
