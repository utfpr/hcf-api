import { Knex } from 'knex'

import { Attributes } from '@/domain/reino/Reino'
import { ReinoCollection, ReinoFilters } from '@/domain/reino/ReinoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

export class ReinoCollectionKnexAdapter implements ReinoCollection {
  private readonly knex: Knex

  constructor({ knex }: Dependencies) {
    this.knex = knex
  }

  async findAll(filters: ReinoFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex<Attributes>('reinos')
        .select(['id', 'nome'])

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      const order = filters.order ?? { column: 'id', direction: 'desc' }
      query.orderBy(order.column, order.direction)

      return Either.right(await query)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list reinos', cause: error }))
    }
  }

  async findById(id: string): Promise<Either<Error, Attributes | undefined>> {
    try {
      const reino = await this.knex<Attributes>('reinos')
        .select(['id', 'nome'])
        .where({ id })
        .first()
      return Either.right(reino)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find reino', cause: error }))
    }
  }
}
