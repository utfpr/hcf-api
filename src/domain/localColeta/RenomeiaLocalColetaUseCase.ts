import { Either } from '@/library/either/Either'

import { LocalColetaNaoEncontradaError } from './error/LocalColetaNaoEncontradaError'
import {
  LocalColeta, LocalColetaAttributes, normalizeLocalColetaDescription
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
    const updated = await this.localColetaCollection.updateById(id, {
      ...attributes,
      descricao: normalizeLocalColetaDescription(attributes.descricao)
    })

    if (updated.left()) return Either.left(updated.value)
    if (!updated.value) return Either.left(new LocalColetaNaoEncontradaError())
    return Either.right(updated.value)
  }
}
