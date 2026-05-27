import { Knex } from 'knex'

import { Attributes } from '@/domain/estado/Estado'
import { EstadoCollection, EstadoFilters } from '@/domain/estado/EstadoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

/** Row shape in DB (filter column exists on table but is not exposed as Attributes). */
type EstadoKnexRecord = Attributes & {
  paises_sigla: string
}

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
      const query = this.knex<EstadoKnexRecord>('estados')
        .select([
          'id',
          'nome',
          'sigla'
        ])
        .orderBy('nome')

      if (filters.paisSigla) {
        query.where('paises_sigla', filters.paisSigla)
      }

      return Either.right(await query)
    } catch (error) {
      return Either.left(
        new CollectionError({ message: 'Failed to list estados', cause: error })
      )
    }
  }
}
