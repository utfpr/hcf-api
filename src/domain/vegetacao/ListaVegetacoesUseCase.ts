import { Either } from '@/library/either/Either'

import { Attributes } from './Vegetacao'
import { VegetacaoCollection, VegetacaoFilters } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

/**
 * Caso de uso responsável pela listagem e filtragem de tipos de vegetação.
 */
export class ListaVegetacoesUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  /**
   * Recupera tipos de vegetação conforme filtros aplicados.
   *
   * @param filters Filtros de busca (ex: nome) e ordenação.
   * @returns Either com lista de atributos das vegetações ou erro de persistência.
   */
  execute(filters: VegetacaoFilters): Promise<Either<Error, Attributes[]>> {
    return this.vegetacaoCollection.findAll(filters)
  }
}
