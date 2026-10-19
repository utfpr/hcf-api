import { Either } from '@/library/either/Either'

import { RotaInput } from './Expedicao'
import { ExpedicaoCollection } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class SubstituiRotasUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  execute(expedicaoId: number, rotas: RotaInput[], updatedBy?: number | null): Promise<Either<Error, void>> {
    return this.expedicaoCollection.substituteRoute(expedicaoId, rotas, updatedBy)
  }
}
