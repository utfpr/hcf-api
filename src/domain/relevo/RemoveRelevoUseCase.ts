import { Either } from '@/library/either/Either'

import { RelevoEmUsoError } from './error/RelevoEmUsoError'
import { RelevoNaoEncontradoError } from './error/RelevoNaoEncontradoError'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

/**
 * Caso de uso responsável pela remoção de um tipo de relevo.
 * Valida a existência do registro e garante que não esteja referenciado em tombos.
 */
export class RemoveRelevoUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  /**
   * Remove o relevo pelo seu identificador após validações de integridade.
   *
   * @param params Objeto contendo o ID do relevo.
   * @returns Either com true se removido, ou erro de não encontrado/em uso/persistência.
   */
  async execute({ id }: { id: string }): Promise<Either<Error, boolean>> {
    const existing = await this.relevoCollection.findById(id)
    if (existing.left()) {
      return existing
    }

    if (!existing.value) {
      return Either.left(new RelevoNaoEncontradoError())
    }

    // Verifica integridade referencial: impede exclusão se houver tombos vinculados
    const used = await this.relevoCollection.countTomboReferences(id)
    if (used.left()) {
      return used
    }

    if (used.value > 0) {
      return Either.left(new RelevoEmUsoError())
    }

    const deleted = await this.relevoCollection.deleteById(id)
    if (deleted.left()) {
      return deleted
    }

    if (!deleted.value) {
      return Either.left(new RelevoNaoEncontradoError())
    }

    return Either.right(deleted.value)
  }
}
