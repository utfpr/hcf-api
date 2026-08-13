import { Either } from '@/library/either/Either'

import { Attributes } from './Estado'
import { EstadoCollection, EstadoFilters } from './EstadoCollection'

interface Dependencies {
  estadoCollection: EstadoCollection
}

export class ListaEstadosUseCase {
  private readonly estadoCollection: EstadoCollection

  constructor(dependencies: Dependencies) {
    this.estadoCollection = dependencies.estadoCollection
  }

  execute(filters: EstadoFilters): Promise<Either<Error, Attributes[]>> {
    return this.estadoCollection.findAll(filters)
  }
}
