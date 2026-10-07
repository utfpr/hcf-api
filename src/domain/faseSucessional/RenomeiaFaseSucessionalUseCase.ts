import { Either } from '@/library/either/Either'

import { FaseSucessionalNaoEncontradoError } from './error/FaseSucessionalNaoEncontradoError'
import { FaseSucessionalNomeDuplicadoError } from './error/FaseSucessionalNomeDuplicadoError'
import { FaseSucessional, Attributes } from './FaseSucessional'
import { FaseSucessionalCollection } from './FaseSucessionalCollection'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

export class RenomeiaFaseSucessionalUseCase {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  async execute({ id, nome }: { id: number; nome: string }): Promise<Either<Error, Attributes>> {
    const normalizedNome = nome.trim()

    const faseSucessional = FaseSucessional.create({ nome: normalizedNome })
    if (faseSucessional.left()) {
      return Either.left(faseSucessional.value)
    }

    const existing = await this.faseSucessionalCollection.findByNome(normalizedNome)
    if (existing.left()) {
      return existing
    }

    if (existing.value && existing.value.id !== id) {
      return Either.left(new FaseSucessionalNomeDuplicadoError())
    }

    const updated = await this.faseSucessionalCollection.update(id, { nome: faseSucessional.value.nome })
    if (updated.left()) {
      return updated
    }

    if (!updated.value) {
      return Either.left(new FaseSucessionalNaoEncontradoError())
    }

    return Either.right(updated.value)
  }
}
