import { Either } from '@/library/either/Either'

import { SoloNaoEncontradoError } from './error/SoloNaoEncontradoError'
import { SoloNomeDuplicadoError } from './error/SoloNomeDuplicadoError'
import { Solo } from './Solo'
import { SoloCollection } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

/**
 * Caso de uso responsável pela alteração de nome de um tipo de solo.
 * Valida se o novo nome já está em uso por outro registro.
 */
export class RenomeiaSoloUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  /**
   * Atualiza o nome do solo identificado por ID.
   *
   * @param params ID do solo e novo nome desejado.
   * @returns Either com a entidade Solo atualizada ou erro de validação/duplicidade/não encontrado.
   */
  async execute({ id, nome }: { id: number; nome: string }): Promise<Either<Error, Solo>> {
    const normalizedNome = nome.trim()
    const solo = Solo.create({ nome: normalizedNome })
    if (solo.left()) {
      return Either.left(solo.value)
    }

    const existingByNome = await this.soloCollection.findByNome(normalizedNome)
    if (existingByNome.left()) {
      return Either.left(existingByNome.value)
    }

    // Impede colisão de nome com outro registro de solo existente
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
