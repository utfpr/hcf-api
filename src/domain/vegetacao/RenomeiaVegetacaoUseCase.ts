import { Either } from '@/library/either/Either'

import { Vegetacao } from './Vegetacao'
import { VegetacaoCollection } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

export class RenomeiaVegetacaoUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  async execute({ id, nome }: { id: string; nome: string }): Promise<Either<Error, Vegetacao | undefined>> {
    const vegetacao = Vegetacao.create({ nome })
    if (vegetacao.left()) {
      return vegetacao
    }

    return this.vegetacaoCollection.update(id, { nome: vegetacao.value.nome })
  }
}
