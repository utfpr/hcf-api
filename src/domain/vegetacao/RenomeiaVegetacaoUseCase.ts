import { Either } from '@/library/either/Either'
import { NotFoundError } from '@/library/http/error/NotFoundError'

import { Attributes, Vegetacao } from './Vegetacao'
import { VegetacaoCollection } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

export class RenomeiaVegetacaoUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  async execute({ id, nome }: { id: number; nome: string }): Promise<Either<Error, Attributes>> {
    const vegetacao = Vegetacao.create({ nome })
    if (vegetacao.left()) {
      return Either.left(vegetacao.value)
    }

    const updated = await this.vegetacaoCollection.update(id, { nome: vegetacao.value.nome })
    if (updated.left()) {
      return Either.left(updated.value)
    }

    if (!updated.value) {
      return Either.left(new NotFoundError({ message: 'Vegetação não encontrada' }))
    }

    return Either.right(updated.value)
  }
}
