import { Either } from '@/library/either/Either'

import {
  Attributes, FICHA_FIELDS, FichaAttributes, Lembrete, UpdateAttributes
} from './Lembrete'
import { LembreteCollection } from './LembreteCollection'

interface Dependencies {
  lembreteCollection: LembreteCollection
}

export type Input = Partial<FichaAttributes> & {
  id: number
  data_coleta?: string
  local_coleta?: string
  updated_by: number | null
}

/**
 * Campos ausentes no corpo mantêm o valor atual; o estado mesclado passa
 * por Lembrete.create() antes de persistir.
 */
export class AtualizaLembreteUseCase {
  private readonly lembreteCollection: LembreteCollection

  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
  }

  async execute(input: Input): Promise<Either<Error, Attributes | null>> {
    const existente = await this.lembreteCollection.findById(input.id)
    if (existente.left()) {
      return Either.left(existente.value)
    }

    if (!existente.value) {
      return Either.right(null)
    }

    const atual = existente.value
    const mesclado: Attributes = {
      ...atual,
      data_coleta: input.data_coleta ?? atual.data_coleta,
      local_coleta: input.local_coleta ?? atual.local_coleta,
      updated_by: input.updated_by
    }

    for (const campo of FICHA_FIELDS) {
      const value = input[campo]
      if (value !== undefined) {
        mesclado[campo] = value
      }
    }

    const validado = Lembrete.create(mesclado)
    if (validado.left()) {
      return Either.left(validado.value)
    }

    const patch: UpdateAttributes = {
      ...validado.value.ficha,
      data_coleta: mesclado.data_coleta,
      local_coleta: mesclado.local_coleta,
      updated_by: mesclado.updated_by
    }

    return this.lembreteCollection.update(input.id, patch)
  }
}
