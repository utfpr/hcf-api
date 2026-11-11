import { Either } from '@/library/either/Either'

import { LocalColetaEmUsoError } from './error/LocalColetaEmUsoError'
import { LocalColetaNaoEncontradaError } from './error/LocalColetaNaoEncontradaError'
import { LocalColetaCollection } from './LocalColetaCollection'

interface Dependencies {
  localColetaCollection: LocalColetaCollection
}

export class RemoveLocalColetaUseCase {
  private readonly localColetaCollection: LocalColetaCollection

  constructor(dependencies: Dependencies) {
    this.localColetaCollection = dependencies.localColetaCollection
  }

  async execute(id: string): Promise<Either<Error, boolean>> {
    const existing = await this.localColetaCollection.findById(id)
    if (existing.left()) return Either.left(existing.value)
    if (!existing.value) return Either.left(new LocalColetaNaoEncontradaError())

    const references = await this.localColetaCollection.countTomboReferences(id)
    if (references.left()) return Either.left(references.value)
    if (references.value > 0) return Either.left(new LocalColetaEmUsoError())

    const deleted = await this.localColetaCollection.deleteById(id)
    if (deleted.left()) return Either.left(deleted.value)
    if (!deleted.value) return Either.left(new LocalColetaNaoEncontradaError())
    return Either.right(true)
  }
}
