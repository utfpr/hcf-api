import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, Expedicao
} from './Expedicao'
import { ExpedicaoCollection } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

/**
 * Caso de uso responsável pelo cadastro completo de uma nova expedição, incluindo participantes e rotas.
 */
export class CadastraExpedicaoUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  /**
   * @param dependencies Repositório de expedições.
   */
  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  /**
   * Valida as regras da entidade e persiste a nova expedição com suas rotas e participantes vinculados.
   *
   * @param dados Dados completos para criação da expedição.
   * @returns Either com os atributos da Expedicao persistida ou erro de validação/infraestrutura.
   */
  async execute(dados: CreateAttributes): Promise<Either<Error, Attributes>> {
    const validacao = Expedicao.create(dados)

    if (validacao.left()) {
      return Either.left(validacao.value)
    }

    return await this.expedicaoCollection.create(dados)
  }
}
