import { Either } from '@/library/either/Either'

import { Attributes } from './Solo'
import { SoloCollection } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

/**
 * Caso de uso responsável pela consulta de um solo por identificador.
 */
export class BuscaSoloPorIdUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  /**
   * Busca os dados do tipo de solo pelo ID.
   *
   * @param params Objeto contendo o ID do solo.
   * @returns Either com os atributos do solo, undefined caso não exista, ou erro de persistência.
   */
  execute({ id }: { id: number }): Promise<Either<Error, Attributes | undefined>> {
    return this.soloCollection.findById(id)
  }
}
