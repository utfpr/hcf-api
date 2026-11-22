import { Either } from '@/library/either/Either'

import { LocalColetaNaoEncontradaError } from './error/LocalColetaNaoEncontradaError'
import {
  LocalColeta, LocalColetaAttributes
} from './LocalColeta'
import { LocalColetaCollection } from './LocalColetaCollection'

interface Dependencies {
  localColetaCollection: LocalColetaCollection
}

export class RenomeiaLocalColetaUseCase {
  private readonly localColetaCollection: LocalColetaCollection

  constructor(dependencies: Dependencies) {
    this.localColetaCollection = dependencies.localColetaCollection
  }

  async execute(id: string, attributes: LocalColetaAttributes): Promise<Either<Error, LocalColeta>> {
    const localColeta = LocalColeta.create(attributes)
    if (localColeta.left()) return Either.left(localColeta.value)
    const normalized = {
      ...attributes,
      descricao: localColeta.value.descricao as string
    }
    const updated = await this.localColetaCollection.updateById(id, normalized)

    if (updated.left()) return Either.left(updated.value)
    if (!updated.value) return Either.left(new LocalColetaNaoEncontradaError())
    return Either.right(updated.value)
  }
}
