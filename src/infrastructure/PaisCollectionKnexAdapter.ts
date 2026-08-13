import { Knex } from 'knex'

import { Attributes } from '@/domain/pais/Pais'
import { PaisCollection, PaisFilters } from '@/domain/pais/PaisCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

export class PaisCollectionKnexAdapter implements PaisCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: PaisFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex<Attributes>('paises')
        .select([
          'id',
          'nome',
          'sigla'
        ])
        .orderBy('nome')

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      return Either.right(await query)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list países', cause: error }))
    }
  }
}
