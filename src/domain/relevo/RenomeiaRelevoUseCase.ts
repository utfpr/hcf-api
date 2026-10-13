import { Either } from '@/library/either/Either'

import { RelevoNaoEncontradoError } from './error/RelevoNaoEncontradoError'
import { RelevoNomeDuplicadoError } from './error/RelevoNomeDuplicadoError'
import { Relevo, Attributes } from './Relevo'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

export class RenomeiaRelevoUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  async execute({ id, nome }: { id: number; nome: string }): Promise<Either<Error, Attributes>> {
    const normalizedNome = nome.trim()

    const relevo = Relevo.create({ nome: normalizedNome })
    if (relevo.left()) {
      return Either.left(relevo.value)
    }

    const existing = await this.relevoCollection.findByNome(normalizedNome)
    if (existing.left()) {
      return existing
    }

    if (existing.value && existing.value.id !== id) {
      return Either.left(new RelevoNomeDuplicadoError())
    }

    const updated = await this.relevoCollection.updateById(id, { nome: relevo.value.nome })
    if (updated.left()) {
      return Either.left(updated.value)
    }

    if (!updated.value) {
      return Either.left(new RelevoNaoEncontradoError())
    }

    return Either.right(updated.value)
  }
}
