import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, LembreteEvidencia
} from './LembreteEvidencia'
import { LembreteEvidenciaCollection } from './LembreteEvidenciaCollection'

interface Dependencies {
  lembreteEvidenciaCollection: LembreteEvidenciaCollection
}

/**
 * Caso de uso para criação e registro de evidência multimídia em um lembrete com suporte a idempotência offline.
 */
export class CriaLembreteEvidenciaUseCase {
  private readonly lembreteEvidenciaCollection: LembreteEvidenciaCollection

  /**
   * @param dependencies Repositório de evidências de lembrete.
   */
  constructor(dependencies: Dependencies) {
    this.lembreteEvidenciaCollection = dependencies.lembreteEvidenciaCollection
  }

  /**
   * Valida e insere a evidência vinculada ao lembrete, tratando retentativas via `client_uuid`.
   *
   * @param input Atributos da evidência a ser persistida.
   * @returns Either com os atributos da LembreteEvidencia persistida ou erro de validação/infraestrutura.
   */
  async execute(input: CreateAttributes): Promise<Either<Error, Attributes>> {
    const validated = LembreteEvidencia.create({
      ...input,
      created_at: new Date(),
      id: 0,
      updated_at: new Date(),
      updated_by: input.created_by
    })

    if (validated.left()) {
      return Either.left(validated.value)
    }

    // Idempotência offline: caso o app móvel reenvie a evidência após oscilação de rede, retorna o registro já persistido pelo client_uuid
    if (input.client_uuid) {
      const existente = await this.lembreteEvidenciaCollection.findByClientUuid(input.client_uuid)
      if (existente.left()) return Either.left(existente.value)
      if (existente.value) return Either.right(existente.value)
    }

    return this.lembreteEvidenciaCollection.create(input)
  }
}
