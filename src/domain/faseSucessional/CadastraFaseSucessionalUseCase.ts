import { Either } from '@/library/either/Either'

import { FaseSucessionalNomeDuplicadoError } from './error/FaseSucessionalNomeDuplicadoError'
import { FaseSucessional, Attributes } from './FaseSucessional'
import { FaseSucessionalCollection } from './FaseSucessionalCollection'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

export class CadastraFaseSucessionalUseCase {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  async execute({ nome }: { nome: string }): Promise<Either<Error, Attributes>> {
    const normalizedNome = nome.trim()

    const faseSucessional = FaseSucessional.create({ nome: normalizedNome })
    if (faseSucessional.left()) {
      return Either.left(faseSucessional.value)
    }

    const existing = await this.faseSucessionalCollection.findByNome(normalizedNome)
    if (existing.left()) {
      return existing
    }

    if (existing.value && existing.value.nome.toLowerCase() === normalizedNome.toLowerCase()) {
      return Either.left(new FaseSucessionalNomeDuplicadoError())
    }

    return this.faseSucessionalCollection.create({ nome: faseSucessional.value.nome })
  }
}
