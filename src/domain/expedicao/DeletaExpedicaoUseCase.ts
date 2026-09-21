import { Either, Left, Right } from '@/library/either/Either'
import { ExpedicaoCollection } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class DeletaExpedicaoUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection
  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  async execute(id: number): Promise<Either<Error, void>> {
    const expedicaoResult = await this.expedicaoCollection.findById(id)
    
    if (expedicaoResult.left() || !expedicaoResult.value) {
      return new Left(new Error('Expedição não encontrada para exclusão.'))
    }

    const deleteResult = await this.expedicaoCollection.delete(id)

    if (deleteResult.left()) {
      return new Left(deleteResult.value as Error)
    }

    return new Right(undefined)
  }
}
