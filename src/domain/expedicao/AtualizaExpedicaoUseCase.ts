import { Either, Left, Right } from '@/library/either/Either'
import { ExpedicaoCollection } from './ExpedicaoCollection'
import { Attributes, Expedicao, UpdateAttributes } from './Expedicao'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class AtualizaExpedicaoUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  async execute(id: number, changes: UpdateAttributes): Promise<Either<Error, Attributes>> {
    const found = await this.expedicaoCollection.findById(id)
    if (found.left()) return Either.left(found.value)
    if (!found.value) return Either.left(new Error('Expedição não encontrada'))

    const current = Expedicao.create(found.value)
    if (current.left()) return Either.left(current.value)

    const updated = current.value.update(changes)
    if (updated.left()) return Either.left(updated.value)

    return this.expedicaoCollection.update(id, changes)
  }
}
