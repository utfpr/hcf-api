import { Either } from '@/library/either/Either'

import { Attributes } from './Relevo'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

export class CadastraRelevoUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  async execute({ nome }: { nome: string }): Promise<Either<Error, Attributes>> {
    const normalizedNome = nome.trim()

    const existing = await this.relevoCollection.findByNome(normalizedNome)
    if (existing.left()) {
      return existing
    }

    if (existing.value && existing.value.nome.toLowerCase() === normalizedNome.toLowerCase()) {
      return Either.left(new Error('Já existe um relevo com esse nome'))
    }

    return this.relevoCollection.create({ id: 0, nome: normalizedNome })
  }
}
