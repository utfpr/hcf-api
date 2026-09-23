import { Either } from '@/library/either/Either'
import { ExpedicaoCollection } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class SubstituiRotasUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  execute(expedicaoId: number, rotas: number[]): Promise<Either<Error, void>> {
    return this.expedicaoCollection.substituteRoute(expedicaoId, rotas)
  }
}
