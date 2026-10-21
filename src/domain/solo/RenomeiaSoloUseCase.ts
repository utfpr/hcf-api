import { Either } from '@/library/either/Either'

import { SoloNaoEncontradoError } from './error/SoloNaoEncontradoError'
import { SoloNomeDuplicadoError } from './error/SoloNomeDuplicadoError'
import { Attributes, Solo } from './Solo'
import { SoloCollection } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

export class RenomeiaSoloUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  async execute({ id, nome }: { id: number; nome: string }): Promise<Either<Error, Attributes>> {
    const normalizedNome = nome.trim()
    const solo = Solo.create({ nome: normalizedNome })
    if (solo.left()) {
      return Either.left(solo.value)
    }

    const existingByNome = await this.soloCollection.findByNome(normalizedNome)
    if (existingByNome.left()) {
      return Either.left(existingByNome.value)
    }

    if (existingByNome.value && existingByNome.value.id !== id) {
      return Either.left(new SoloNomeDuplicadoError())
    }

    const updated = await this.soloCollection.update(id, { nome: solo.value.nome })
    if (updated.left()) {
      return Either.left(updated.value)
    }

    if (!updated.value) {
      return Either.left(new SoloNaoEncontradoError())
    }

    return Either.right(updated.value)
  }
}
