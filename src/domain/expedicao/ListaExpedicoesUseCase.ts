import { Either } from '@/library/either/Either'

import {
  ExpedicaoCollection, ExpedicaoFilters, ExpedicaoListItem, Paginated
} from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class ListaExpedicoesUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  async execute(filters: ExpedicaoFilters): Promise<Either<Error, Paginated<ExpedicaoListItem>>> {
    // repassa os filtros para o adapter realizar a busca
    return await this.expedicaoCollection.findAll(filters)
  }
}
