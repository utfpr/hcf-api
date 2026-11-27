import { Either } from '@/library/either/Either'

import { ExpedicaoNaoEncontradaError } from './error/ExpedicaoNaoEncontradaError'
import {
  Attributes, Expedicao, UpdateAttributes
} from './Expedicao'
import { ExpedicaoCollection } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

/**
 * Caso de uso para atualização de dados cadastrais de uma expedição existente.
 */
export class AtualizaExpedicaoUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  /**
   * @param dependencies Repositório de expedições.
   */
  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  /**
   * Executa a atualização dos dados cadastrais da expedição após revalidação das regras de negócio.
   *
   * @param id Identificador numérico da expedição a atualizar.
   * @param changes Atributos atualizados a serem aplicados.
   * @returns Either com a Expedicao atualizada ou erro de validação/não encontrada.
   */
  async execute(id: number, changes: UpdateAttributes): Promise<Either<Error, Attributes>> {
    const found = await this.expedicaoCollection.findById(id)
    if (found.left()) return Either.left(found.value)
    if (!found.value) return Either.left(new ExpedicaoNaoEncontradaError())

    const current = Expedicao.create(found.value)
    if (current.left()) return Either.left(current.value)

    const updated = current.value.update(changes)
    if (updated.left()) return Either.left(updated.value)

    return this.expedicaoCollection.update(id, changes)
  }
}
