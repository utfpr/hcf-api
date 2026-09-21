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
    // Valida as regras de negócio passando pela Entidade.
    // Entidade exige id e datas de auditoria na interface, mockado para a validação passar.
    const validacao = Expedicao.create({
      ...dados,
      id: 0,
      created_at: new Date(),
      updated_at: new Date(),
      updated_by: null
    } as Attributes)

    if (validacao.left()) {
      return Either.left(validacao.value)
    }

    // Adapter para persistir no banco
    return await this.expedicaoCollection.create(dados)
  }
}
