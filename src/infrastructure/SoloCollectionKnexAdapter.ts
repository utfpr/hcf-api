import { Knex } from 'knex'

import { Attributes } from '@/domain/solo/Solo'
import { SoloCollection, SoloFilters } from '@/domain/solo/SoloCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

export class SoloCollectionKnexAdapter implements SoloCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: SoloFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex<Attributes>('solos')
        .select(['id', 'nome'])

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      const order = filters.order ?? { column: 'id', direction: 'desc' }
      query.orderBy(order.column, order.direction)

      return Either.right(await query)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list solos', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const solo = await this.knex<Attributes>('solos').select(['id', 'nome']).where({ id }).first()
      return Either.right(solo ?? null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find solo', cause: error }))
    }
  }
}
