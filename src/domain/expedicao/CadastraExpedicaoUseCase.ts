import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, Expedicao
} from './Expedicao'
import { ExpedicaoCollection } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class CadastraExpedicaoUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  async execute(dados: CreateAttributes): Promise<Either<Error, Attributes>> {
    const validacao = Expedicao.create(dados)

    if (validacao.left()) {
      return Either.left(validacao.value)
    }

    return await this.expedicaoCollection.create(dados)
  }
}
