import { Either } from '@/library/either/Either'

import {
  LocalColeta, LocalColetaAttributes
} from './LocalColeta'
import { LocalColetaCollection } from './LocalColetaCollection'

interface Dependencies {
  localColetaCollection: LocalColetaCollection
}

export class CadastraLocalColetaUseCase {
  private readonly localColetaCollection: LocalColetaCollection

  constructor(dependencies: Dependencies) {
    this.localColetaCollection = dependencies.localColetaCollection
  }

  async execute(attributes: LocalColetaAttributes): Promise<Either<Error, LocalColeta>> {
    const localColeta = LocalColeta.create(attributes)
    if (localColeta.left()) return Either.left(localColeta.value)
    const normalized = {
      ...attributes,
      descricao: localColeta.value.descricao as string
    }
    return this.localColetaCollection.create(normalized)
  }
}
