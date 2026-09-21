import { Either } from '@/library/either/Either'
import { Attributes } from './Expedicao'
import { ExpedicaoCollection, ExpedicaoFilters, Paginated } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class ListaExpedicoesUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  async execute(filters: ExpedicaoFilters): Promise<Either<Error, Paginated<Attributes>>> {
    // repassa os filtros para o adapter realizar a busca
    return await this.expedicaoCollection.findAll(filters)
  }
}
