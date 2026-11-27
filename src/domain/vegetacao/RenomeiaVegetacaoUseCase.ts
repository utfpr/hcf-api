import { Either } from '@/library/either/Either'

import { Vegetacao } from './Vegetacao'
import { VegetacaoCollection } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

/**
 * Caso de uso responsável pela alteração de nome de um tipo de vegetação.
 */
export class RenomeiaVegetacaoUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  /**
   * Atualiza o nome da vegetação identificada por ID.
   *
   * @param params ID e novo nome da vegetação.
   * @returns Either com a entidade Vegetacao atualizada, undefined se não encontrada, ou erro de validação/persistência.
   */
  async execute({ id, nome }: { id: string; nome: string }): Promise<Either<Error, Vegetacao | undefined>> {
    const vegetacao = Vegetacao.create({ nome })
    if (vegetacao.left()) {
      return vegetacao
    }

    return this.vegetacaoCollection.update(id, { nome: vegetacao.value.nome })
  }
}
