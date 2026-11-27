import { Either } from '@/library/either/Either'

import { FaseSucessionalNaoEncontradoError } from './error/FaseSucessionalNaoEncontradoError'
import { FaseSucessionalNomeDuplicadoError } from './error/FaseSucessionalNomeDuplicadoError'
import { FaseSucessional } from './FaseSucessional'
import { FaseSucessionalCollection } from './FaseSucessionalCollection'

interface Dependencies {
  faseSucessionalCollection: FaseSucessionalCollection
}

/**
 * Caso de uso responsável pela alteração de nome de uma fase sucessional.
 * Valida unicidade garantindo que outro registro com o mesmo nome não exista.
 */
export class RenomeiaFaseSucessionalUseCase {
  private readonly faseSucessionalCollection: FaseSucessionalCollection

  constructor(dependencies: Dependencies) {
    this.faseSucessionalCollection = dependencies.faseSucessionalCollection
  }

  /**
   * Atualiza o nome da fase sucessional identificada por ID.
   *
   * @param params ID e novo nome da fase sucessional.
   * @returns Either com a entidade atualizada ou erro de validação/duplicidade/não encontrado.
   */
  async execute({ id, nome }: { id: string; nome: string }): Promise<Either<Error, FaseSucessional>> {
    const normalizedNome = nome.trim()

    const faseSucessional = FaseSucessional.create({ nome: normalizedNome })
    if (faseSucessional.left()) {
      return Either.left(faseSucessional.value)
    }

    const existing = await this.faseSucessionalCollection.findByNome(normalizedNome)
    if (existing.left()) {
      return existing
    }

    // Impede colisão com outra fase sucessional com o mesmo nome
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
