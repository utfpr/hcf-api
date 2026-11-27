import { Either } from '@/library/either/Either'

import { SoloNaoEncontradoError } from './error/SoloNaoEncontradoError'
import { SoloCollection } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

/**
 * Caso de uso responsável pela exclusão de um solo.
 * Valida a existência prévia do registro antes da exclusão.
 */
export class RemoveSoloUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  /**
   * Remove o solo pelo identificador fornecido.
   *
   * @param params Objeto contendo o ID do solo a ser removido.
   * @returns Either com true em caso de sucesso, ou erro de não encontrado/persistência/uso relacional.
   */
  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const existing = await this.soloCollection.findById(id)
    if (existing.left()) {
      return Either.left(existing.value)
    }

    if (!existing.value) {
      return Either.left(new SoloNaoEncontradoError())
    }

    const deleted = await this.soloCollection.delete(id)
    if (deleted.left()) {
      return deleted
    }

    if (!deleted.value) {
      return Either.left(new SoloNaoEncontradoError())
    }

    return Either.right(true)
  }
}
