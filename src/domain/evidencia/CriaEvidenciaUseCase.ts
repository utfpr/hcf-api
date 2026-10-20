import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, Evidencia
} from './Evidencia'
import { EvidenciaCollection } from './EvidenciaCollection'

interface Dependencies {
  evidenciaCollection: EvidenciaCollection
}

export class CriaEvidenciaUseCase {
  private readonly evidenciaCollection: EvidenciaCollection

  constructor(dependencies: Dependencies) {
    this.evidenciaCollection = dependencies.evidenciaCollection
  }

  async execute(input: CreateAttributes): Promise<Either<Error, Attributes>> {
    const validated = Evidencia.create(input)

    if (validated.left()) {
      return Either.left(validated.value)
    }

    return this.evidenciaCollection.create(input)
  }
}
