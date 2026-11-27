import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, Lembrete
} from './Lembrete'
import { LembreteCollection } from './LembreteCollection'

interface Dependencies {
  lembreteCollection: LembreteCollection
}

/**
 * Caso de uso para criação de lembretes botânicos com suporte a chave de idempotência offline.
 */
export class CriaLembreteUseCase {
  private readonly lembreteCollection: LembreteCollection

  /**
   * @param dependencies Repositório de persistência de lembretes.
   */
  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
  }

  /**
   * Valida e persiste um novo lembrete, retornando o registro preexistente caso um `client_uuid` já cadastrado seja reenviado.
   *
   * @param input Dados para criação do lembrete.
   * @returns Either com o Lembrete criado ou erro de validação/infraestrutura.
   */
  async execute(input: CreateAttributes): Promise<Either<Error, Attributes>> {
    const validated = Lembrete.create(input)

    if (validated.left()) {
      return Either.left(validated.value)
    }

    // Idempotência offline: caso o app móvel reenvie o lembrete após oscilação de conexão, devolve o registro já existente pelo client_uuid
    if (input.client_uuid) {
      const existente = await this.lembreteCollection.findByClientUuid(input.client_uuid)
      if (existente.left()) return Either.left(existente.value)
      if (existente.value) return Either.right(existente.value)
    }

    return this.lembreteCollection.create(input)
  }
}
