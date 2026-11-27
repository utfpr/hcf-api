import { Either } from '@/library/either/Either'

import { SoloNomeDuplicadoError } from './error/SoloNomeDuplicadoError'
import { Solo } from './Solo'
import { SoloCollection } from './SoloCollection'

interface Dependencies {
  soloCollection: SoloCollection
}

/**
 * Caso de uso responsável pelo cadastro de novos tipos de solo.
 * Valida a integridade do nome e impede cadastros duplicados.
 */
export class CadastraSoloUseCase {
  private readonly soloCollection: SoloCollection

  constructor(dependencies: Dependencies) {
    this.soloCollection = dependencies.soloCollection
  }

  /**
   * Executa a criação do solo após validar formato e unicidade do nome.
   *
   * @param params Objeto contendo o nome do novo solo.
   * @returns Either com a entidade Solo criada ou erro de validação/duplicidade/persistência.
   */
  async execute({ nome }: { nome: string }): Promise<Either<Error, Solo>> {
    const normalizedNome = nome.trim()
    const created = Solo.create({ nome: normalizedNome })
    if (created.left()) {
      return Either.left(created.value)
    }

    const existing = await this.soloCollection.findByNome(normalizedNome)
    if (existing.left()) {
      return Either.left(existing.value)
    }

    if (existing.value) {
      return Either.left(new SoloNomeDuplicadoError())
    }

    return this.soloCollection.create({ nome: created.value.nome })
  }
}
