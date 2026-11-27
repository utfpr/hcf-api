import { Either } from '@/library/either/Either'

import { Attributes } from './Relevo'
import { RelevoCollection, RelevoFilters } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

/**
 * Caso de uso responsável pela listagem e filtragem de relevos.
 */
export class ListaRelevosUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  /**
   * Recupera lista de relevos cadastrados segundo os filtros fornecidos.
   *
   * @param filters Filtros de busca (ex: nome) e ordenação.
   * @returns Either com array de atributos dos relevos ou erro de persistência.
   */
  execute(filters: RelevoFilters): Promise<Either<Error, Attributes[]>> {
    return this.relevoCollection.findAll(filters)
  }
}
