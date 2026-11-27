import { Either } from '@/library/either/Either'

import { Attributes } from './Estado'
import { EstadoCollection, EstadoFilters } from './EstadoCollection'

interface Dependencies {
  estadoCollection: EstadoCollection
}

/**
 * Caso de uso responsável pela listagem de estados de um país.
 */
export class ListaEstadosUseCase {
  private readonly estadoCollection: EstadoCollection

  constructor(dependencies: Dependencies) {
    this.estadoCollection = dependencies.estadoCollection
  }

  /**
   * Recupera a lista de estados associados à sigla de país informada.
   *
   * @param filters Objeto contendo o filtro da sigla do país.
   * @returns Either com array de estados ou erro de persistência.
   */
  execute(filters: EstadoFilters): Promise<Either<Error, Attributes[]>> {
    return this.estadoCollection.findAll(filters)
  }
}
