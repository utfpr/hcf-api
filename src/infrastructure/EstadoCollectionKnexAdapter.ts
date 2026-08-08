import { Knex } from 'knex'

import { Attributes } from '@/domain/estado/Estado'
import { EstadoCollection, EstadoFilters } from '@/domain/estado/EstadoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

export class EstadoCollectionKnexAdapter implements EstadoCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: EstadoFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex('estados')
        .select([
          'estados.id',
          'estados.nome',
          'estados.sigla'
        ])
        .orderBy('estados.nome')

      if (filters.paisSigla) {
        query
          .join('paises', 'estados.pais_id', 'paises.id')
          .where('paises.sigla', filters.paisSigla)
      }

      return Either.right(await query)
    } catch (error) {
      return Either.left(
        new CollectionError({ message: 'Failed to list estados', cause: error })
      )
    }
  }
}
