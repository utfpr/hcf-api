import { Either } from '@/library/either/Either'

import { SoloNomeDuplicadoError } from './error/SoloNomeDuplicadoError'
import { Attributes, Solo } from './Solo'
import { SoloCollection } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

export class CadastraSoloUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  async execute({ nome }: { nome: string }): Promise<Either<Error, Attributes>> {
    const normalizedNome = nome.trim()
    const created = Solo.create({ nome: normalizedNome })
    if (created.left()) {
      return Either.left(created.value)
    }

    const existing = await this.soloCollection.findByNome(normalizedNome)
    if (existing.left()) {
      return Either.left(existing.value)
    }

    if (existing.value) {
      return Either.left(new SoloNomeDuplicadoError())
    }

    return this.soloCollection.create({ nome: created.value.nome })
  }
}
