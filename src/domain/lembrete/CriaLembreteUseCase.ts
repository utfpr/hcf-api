import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, Lembrete
} from './Lembrete'
import { LembreteCollection } from './LembreteCollection'

interface Dependencies {
  lembreteCollection: LembreteCollection
}

export class CriaLembreteUseCase {
  private readonly lembreteCollection: LembreteCollection

  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
  }

  async execute(input: CreateAttributes): Promise<Either<Error, Attributes>> {
    const validated = Lembrete.create(input)

    if (validated.left()) {
      return Either.left(validated.value)
    }

    return this.lembreteCollection.create(input)
  }
}
