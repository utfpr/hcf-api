import { Either } from '@/library/either/Either'
import { ExpedicaoCollection } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class AdicionaParticipanteUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  execute(expedicaoId: number, usuarioId: number): Promise<Either<Error, void>> {
    return this.expedicaoCollection.addParticipant(expedicaoId, usuarioId)
  }
}
