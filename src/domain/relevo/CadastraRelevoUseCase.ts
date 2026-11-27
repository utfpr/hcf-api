import { Either } from '@/library/either/Either'

import { Relevo } from './Relevo'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

/**
 * Caso de uso responsável pelo cadastro de novos tipos de relevo.
 */
export class CadastraRelevoUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  /**
   * Cria um novo relevo após validar os dados de entrada.
   *
   * @param params Objeto contendo o nome do relevo.
   * @returns Either com a entidade Relevo criada ou erro de validação/persistência.
   */
  async execute({ nome }: { nome: string }): Promise<Either<Error, Relevo>> {
    const relevo = Relevo.create({ nome })
    if (relevo.left()) {
      return relevo
    }

    return this.relevoCollection.create({ nome: relevo.value.nome })
  }
}
