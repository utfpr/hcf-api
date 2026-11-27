import { Either } from '@/library/either/Either'

import { Attributes } from './Relevo'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

/**
 * Caso de uso responsável pela consulta de relevo por identificador.
 */
export class BuscaRelevoPorIdUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  /**
   * Busca um tipo de relevo pelo ID.
   *
   * @param params Objeto contendo o ID em string do relevo.
   * @returns Either com os atributos do relevo, undefined se inexistente, ou erro de persistência.
   */
  execute({ id }: { id: string }): Promise<Either<Error, Attributes | undefined>> {
    return this.relevoCollection.findById(id)
  }
}
