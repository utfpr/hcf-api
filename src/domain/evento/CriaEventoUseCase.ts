import { Either } from '@/library/either/Either'

import {
  Attributes, CreateAttributes, Evento
} from './Evento'
import { EventoCollection } from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
}

/**
 * Caso de uso para criação de novos eventos em uma expedição (tipo DIARIO ou COLETA).
 * Oferece suporte a idempotência na sincronização offline através de `client_uuid`.
 */
export class CriaEventoUseCase {
  private readonly eventoCollection: EventoCollection

  /**
   * @param dependencies Repositório de persistência de eventos.
   */
  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
  }

  /**
   * Valida e persiste um novo evento, garantindo idempotência caso um `client_uuid` já existente seja reenviado.
   *
   * @param input Atributos para criação do evento.
   * @returns Either com o Evento persistido ou Error de validação/infraestrutura.
   */
  async execute(input: CreateAttributes): Promise<Either<Error, Attributes>> {
    const validated = Evento.create(input)

    if (validated.left()) {
      return Either.left(validated.value)
    }

    // Idempotência offline: caso o app móvel reenvie o evento após oscilação de rede, retorna o registro já persistido pelo client_uuid evitando duplicatas
    if (input.client_uuid) {
      const existente = await this.eventoCollection.findByClientUuid(input.client_uuid)
      if (existente.left()) return Either.left(existente.value)
      if (existente.value) return Either.right(existente.value)
    }

    return this.eventoCollection.create(input)
  }
}
