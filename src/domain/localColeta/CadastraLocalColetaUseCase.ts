import { Either } from '@/library/either/Either'

import {
  LocalColeta, LocalColetaAttributes, normalizeLocalColetaDescription
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

  execute(attributes: LocalColetaAttributes): Promise<Either<Error, LocalColeta>> {
    return this.localColetaCollection.create({
      ...attributes,
      descricao: normalizeLocalColetaDescription(attributes.descricao)
    })
  }
}
