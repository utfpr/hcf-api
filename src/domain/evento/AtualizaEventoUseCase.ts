import { Either } from '@/library/either/Either'

import { AtualizaEventoInput, AtualizaEventoValidator } from './AtualizaEventoValidator'
import { Attributes } from './Evento'
import { AtualizaEventoAttributes, EventoCollection } from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
  atualizaEventoValidator?: AtualizaEventoValidator
}

/**
 * Parâmetros de entrada para atualização de evento com o identificador numérico obrigatório.
 */
export type Input = AtualizaEventoInput & { id: number }

/**
 * Caso de uso responsável pela atualização do agregado Evento e sua respectiva Ficha de Coleta.
 * Delega a validação de coerência entre tipo ('DIARIO' ou 'COLETA') e ficha para o AtualizaEventoValidator.
 */
export class AtualizaEventoUseCase {
  private readonly eventoCollection: EventoCollection
  private readonly atualizaEventoValidator: AtualizaEventoValidator

  /**
   * @param dependencies Repositório de eventos e validador de atualização.
   */
  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
    this.atualizaEventoValidator = dependencies.atualizaEventoValidator ?? new AtualizaEventoValidator()
  }

  /**
   * Executa a atualização do evento, mesclando dados anteriores com novos atributos validados.
   *
   * @param input Dados a serem atualizados juntamente com o ID do evento.
   * @returns Either com o Evento atualizado, null se não encontrado ou Error em caso de falha de validação/infraestrutura.
   */
  async execute(input: Input): Promise<Either<Error, Attributes | null>> {
    const existente = await this.eventoCollection.findById(input.id)
    if (existente.left()) {
      return Either.left(existente.value)
    }

    if (!existente.value) {
      return Either.right(null)
    }

    const validado = this.atualizaEventoValidator.validar(existente.value, input)
    if (validado.left()) {
      return Either.left(validado.value)
    }

    const mesclado = validado.value

    const patch: AtualizaEventoAttributes = {
      altitude: mesclado.altitude,
      data_captura: mesclado.data_captura,
      coleta: mesclado.coleta,
      latitude: mesclado.latitude,
      longitude: mesclado.longitude,
      observacoes: mesclado.observacoes,
      tipo: mesclado.tipo,
      updated_by: input.updated_by
    }

    return this.eventoCollection.update(input.id, patch)
  }
}
