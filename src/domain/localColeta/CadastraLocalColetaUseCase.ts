import { Either } from '@/library/either/Either'

import {
  LocalColeta, LocalColetaAttributes
} from './LocalColeta'
import { LocalColetaCollection } from './LocalColetaCollection'

interface Dependencies {
  localColetaCollection: LocalColetaCollection
}

/**
 * Caso de uso responsável pelo cadastro de novos locais de coleta.
 * Normaliza e valida a descrição e persiste no banco de dados.
 */
export class CadastraLocalColetaUseCase {
  private readonly localColetaCollection: LocalColetaCollection

  constructor(dependencies: Dependencies) {
    this.localColetaCollection = dependencies.localColetaCollection
  }

  /**
   * Cria o local de coleta normalizando a descrição antes de persistir.
   *
   * @param attributes Dados para cadastro do local de coleta.
   * @returns Either com o LocalColeta persistido ou erro de validação/duplicidade/referência.
   */
  async execute(attributes: LocalColetaAttributes): Promise<Either<Error, LocalColeta>> {
    const localColeta = LocalColeta.create(attributes)
    if (localColeta.left()) return Either.left(localColeta.value)
    const normalized = {
      ...attributes,
      descricao: localColeta.value.descricao as string
    }
    return this.localColetaCollection.create(normalized)
  }
}
