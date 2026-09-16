import { Knex } from 'knex'

import { Attributes } from '@/domain/faseSucessional/FaseSucessional'
import { FaseSucessionalCollection, FaseSucessionalFilters } from '@/domain/faseSucessional/FaseSucessionalCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

export class FaseSucessionalCollectionKnexAdapter implements FaseSucessionalCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: FaseSucessionalFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex<Attributes>('fase_sucessional')
        .select(['id', 'nome'])

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      if (filters.order) {
        query.orderBy(filters.order.column, filters.order.direction)
      } else {
        query.orderBy('id', 'desc')
      }

      return Either.right(await query)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list fases sucessionais', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const faseSucessional = await this.knex<Attributes>('fase_sucessional')
        .select(['id', 'nome'])
        .where({ id })
        .first()

      return Either.right(faseSucessional ?? null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find fase sucessional by id', cause: error }))
    }
  }
}
