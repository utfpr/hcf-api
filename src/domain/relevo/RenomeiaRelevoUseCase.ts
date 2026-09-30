import { Either } from '@/library/either/Either'

import { Attributes } from './Relevo'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

export class RenomeiaRelevoUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  async execute({ id, nome }: { id: number; nome: string }): Promise<Either<Error, Attributes | null>> {
    const normalizedNome = nome.trim()

    const existing = await this.relevoCollection.findByNome(normalizedNome)
    if (existing.left()) {
      return existing
    }

    if (existing.value && existing.value.id !== id) {
      return Either.left(new Error('Já existe um relevo com esse nome'))
    }

    return this.relevoCollection.updateById(id, { id, nome: normalizedNome })
  }
}
