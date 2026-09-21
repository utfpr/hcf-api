import { Knex } from 'knex'

import { Attributes } from '@/domain/relevo/Relevo'
import { RelevoCollection, RelevoFilters } from '@/domain/relevo/RelevoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

export class RelevoCollectionKnexAdapter implements RelevoCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: RelevoFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex<Attributes>('relevos')
        .select(['id', 'nome'])

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      const order = filters.order ?? { column: 'id', direction: 'desc' }
      query.orderBy(order.column, order.direction)

      return Either.right(await query)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list relevos', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const relevo = await this.knex<Attributes>('relevos').select(['id', 'nome']).where({ id }).first()
      return Either.right(relevo ?? null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find relevo', cause: error }))
    }
  }
}
