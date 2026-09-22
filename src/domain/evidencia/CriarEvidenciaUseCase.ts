import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, Evidencia
} from './Evidencia'
import { EvidenciaCollection } from './EvidenciaCollection'

interface Dependencies {
  evidenciaCollection: EvidenciaCollection
}

export class CriarEvidenciaUseCase {
  private readonly evidenciaCollection: EvidenciaCollection

  constructor(dependencies: Dependencies) {
    this.evidenciaCollection = dependencies.evidenciaCollection
  }

  async execute(input: CreateAttributes): Promise<Either<Error, Attributes>> {
    const validated = Evidencia.create({
      ...input,
      created_at: new Date(),
      id: 0,
      updated_at: new Date(),
      updated_by: input.created_by
    })

    if (validated.left()) {
      return Either.left(validated.value)
    }

    return this.evidenciaCollection.create(input)
  }
}
