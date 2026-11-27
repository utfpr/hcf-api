import { Either } from '@/library/either/Either'

import { Vegetacao } from './Vegetacao'
import { VegetacaoCollection } from './VegetacaoCollection'

interface Dependencies {
  vegetacaoCollection: VegetacaoCollection
}

/**
 * Caso de uso responsável pelo cadastro de novos tipos de vegetação.
 */
export class CadastraVegetacaoUseCase {
  private readonly vegetacaoCollection: VegetacaoCollection

  constructor(dependencies: Dependencies) {
    this.vegetacaoCollection = dependencies.vegetacaoCollection
  }

  /**
   * Executa a criação de um tipo de vegetação após validar o nome.
   *
   * @param params Objeto contendo o nome da vegetação.
   * @returns Either com a entidade Vegetacao criada ou erro de validação/persistência.
   */
  async execute({ nome }: { nome: string }): Promise<Either<Error, Vegetacao>> {
    const vegetacao = Vegetacao.create({ nome })
    if (vegetacao.left()) {
      return vegetacao
    }

    return this.vegetacaoCollection.create({ nome: vegetacao.value.nome })
  }
}
