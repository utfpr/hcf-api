import { Either } from '@/library/either/Either'

import { LocalColetaEmUsoError } from './error/LocalColetaEmUsoError'
import { LocalColetaNaoEncontradaError } from './error/LocalColetaNaoEncontradaError'
import { LocalColetaCollection } from './LocalColetaCollection'

interface Dependencies {
  localColetaCollection: LocalColetaCollection
}

/**
 * Caso de uso responsável pela exclusão de um local de coleta.
 * Verifica existência e integridade referencial com tombos cadastrados.
 */
export class RemoveLocalColetaUseCase {
  private readonly localColetaCollection: LocalColetaCollection

  constructor(dependencies: Dependencies) {
    this.localColetaCollection = dependencies.localColetaCollection
  }

  /**
   * Remove o local de coleta identificado por ID.
   *
   * @param id Identificador do local de coleta.
   * @returns Either com true se removido, ou erro de não encontrado/em uso/persistência.
   */
  async execute(id: string): Promise<Either<Error, boolean>> {
    const existing = await this.localColetaCollection.findById(id)
    if (existing.left()) return Either.left(existing.value)
    if (!existing.value) return Either.left(new LocalColetaNaoEncontradaError())

    // Impede exclusão se houver tombos associados ao local de coleta
    const references = await this.localColetaCollection.countTomboReferences(id)
    if (references.left()) return Either.left(references.value)
    if (references.value > 0) return Either.left(new LocalColetaEmUsoError())

    const deleted = await this.localColetaCollection.deleteById(id)
    if (deleted.left()) return Either.left(deleted.value)
    if (!deleted.value) return Either.left(new LocalColetaNaoEncontradaError())
    return Either.right(true)
  }
}
