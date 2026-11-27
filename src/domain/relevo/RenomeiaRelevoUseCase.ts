import { Either } from '@/library/either/Either'

import { RelevoNaoEncontradoError } from './error/RelevoNaoEncontradoError'
import { Relevo } from './Relevo'
import { RelevoCollection } from './RelevoCollection'

interface Dependencies {
  relevoCollection: RelevoCollection
}

/**
 * Caso de uso responsável pela alteração de nome de um relevo.
 */
export class RenomeiaRelevoUseCase {
  private readonly relevoCollection: RelevoCollection

  constructor(dependencies: Dependencies) {
    this.relevoCollection = dependencies.relevoCollection
  }

  /**
   * Atualiza o nome do relevo identificado por ID.
   *
   * @param params ID do relevo e novo nome.
   * @returns Either com a entidade Relevo atualizada ou erro de validação/não encontrado/persistência.
   */
  async execute({ id, nome }: { id: string; nome: string }): Promise<Either<Error, Relevo>> {
    const relevo = Relevo.create({ nome })
    if (relevo.left()) {
      return relevo
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
