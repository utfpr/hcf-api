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
    // Lembrete.create() exige um Attributes completo, usado só para validar
    // a regra de negócio (data e local de coleta).
    const validated = Lembrete.create({
      ...input,
      created_at: new Date(),
      id: 0,
      updated_at: new Date(),
      updated_by: input.created_by
    })

    if (validated.left()) {
      return Either.left(validated.value)
    }

    return this.lembreteCollection.create(input)
  }
}
