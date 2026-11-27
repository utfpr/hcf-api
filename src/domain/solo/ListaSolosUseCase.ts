import { Either } from '@/library/either/Either'

import { Attributes } from './Solo'
import { SoloCollection, SoloFilters } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

/**
 * Caso de uso responsável pela listagem e filtragem de tipos de solo.
 */
export class ListaSolosUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  /**
   * Recupera a lista de solos conforme filtros aplicados.
   *
   * @param filters Filtros de busca (ex: nome) e ordenação.
   * @returns Either com lista de atributos dos solos ou erro de persistência.
   */
  execute(filters: SoloFilters): Promise<Either<Error, Attributes[]>> {
    return this.soloCollection.findAll(filters)
  }
}
