import { Either } from '@/library/either/Either'

import { Attributes } from './Lembrete'
import {
  LembreteCollection, LembreteFilters, Paginated
} from './LembreteCollection'

interface Dependencies {
  lembreteCollection: LembreteCollection
}

export class ListaLembretesUseCase {
  private readonly lembreteCollection: LembreteCollection

  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
  }

  execute(filters: LembreteFilters): Promise<Either<Error, Paginated<Attributes>>> {
    return this.lembreteCollection.findAll(filters)
  }
}
