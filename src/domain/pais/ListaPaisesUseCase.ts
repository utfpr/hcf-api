import { Either } from '@/library/either/Either'

import { Attributes } from './Pais'
import { PaisCollection, PaisFilters } from './PaisCollection'

interface Dependencies {
  paisCollection: PaisCollection
}

/**
 * Caso de uso responsável pela listagem de países cadastrados.
 */
export class ListaPaisesUseCase {
  private readonly paisCollection: PaisCollection

  constructor(dependencies: Dependencies) {
    this.paisCollection = dependencies.paisCollection
  }

  /**
   * Recupera a lista de países de acordo com os filtros de busca.
   *
   * @param filters Filtros de busca (ex: nome).
   * @returns Either com array de países ou erro de persistência.
   */
  async execute(filters: PaisFilters): Promise<Either<Error, Attributes[]>> {
    return this.paisCollection.findAll(filters)
  }
}
