import { Either } from '@/library/either/Either'

import { RelevoNomeDuplicadoError } from './error/RelevoNomeDuplicadoError'
import { Relevo, Attributes } from './Relevo'
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

    const relevo = Relevo.create({ nome: normalizedNome })
    if (relevo.left()) {
      return Either.left(relevo.value)
    }

    const existing = await this.relevoCollection.findByNome(normalizedNome)
    if (existing.left()) {
      return existing
    }

    if (existing.value && existing.value.nome.toLowerCase() === normalizedNome.toLowerCase()) {
      return Either.left(new RelevoNomeDuplicadoError())
    }

    return this.relevoCollection.create({ nome: relevo.value.nome })
  }
}
