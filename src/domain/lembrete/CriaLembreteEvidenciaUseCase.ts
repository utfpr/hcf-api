import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, LembreteEvidencia
} from './LembreteEvidencia'
import { LembreteEvidenciaCollection } from './LembreteEvidenciaCollection'

interface Dependencies {
  lembreteEvidenciaCollection: LembreteEvidenciaCollection
}

export class CriaLembreteEvidenciaUseCase {
  private readonly lembreteEvidenciaCollection: LembreteEvidenciaCollection

  constructor(dependencies: Dependencies) {
    this.lembreteEvidenciaCollection = dependencies.lembreteEvidenciaCollection
  }

  async execute(input: CreateAttributes): Promise<Either<Error, Attributes>> {
    const validated = LembreteEvidencia.create({
      ...input,
      created_at: new Date(),
      id: 0,
      updated_at: new Date(),
      updated_by: input.created_by
    })

    if (validated.left()) {
      return Either.left(validated.value)
    }

    return this.lembreteEvidenciaCollection.create(input)
  }
}
