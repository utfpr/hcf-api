import {
  Either, Left, Right
} from '@/library/either/Either'

import { Attributes } from './Expedicao'
import { ExpedicaoCollection } from './ExpedicaoCollection'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

export class BuscaExpedicaoUseCase {
  private readonly expedicaoCollection: ExpedicaoCollection

  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  async execute(id: number): Promise<Either<Error, Attributes>> {
    const result = await this.expedicaoCollection.findById(id)

    // operação de banco falhou
    if (result.left()) {
      return new Left(result.value)
    }

    const expedicao = result.value

    // buscou man não encontrou o ID (null ou undefined)
    if (!expedicao) {
      return new Left(new Error('Expedição não encontrada.'))
    }

    // sucesso
    return new Right(expedicao)
  }
}
