import { Knex } from 'knex'

import { Reino } from '@/domain/reino/Reino'
import { ReinoCollection, ReinoFilters } from '@/domain/reino/ReinoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

interface ReinoRow {
  id: number | string
  nome: string
}

export class ReinoCollectionKnexAdapter implements ReinoCollection {
  private readonly knex: Knex

  constructor({ knex }: Dependencies) {
    this.knex = knex
  }

  async findAll(filters: ReinoFilters): Promise<Either<Error, Reino[]>> {
    try {
      const query = this.knex<ReinoRow>('reinos')
        .select(['id', 'nome'])

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      const order = filters.order ?? { column: 'id', direction: 'desc' }
      query.orderBy(order.column, order.direction)

      const reinos: Reino[] = []
      for (const row of await query) {
        const reino = Reino.create({ id: Number(row.id), nome: row.nome })
        if (reino.left()) {
          return Either.left(reino.value)
        }
        reinos.push(reino.value)
      }

      return Either.right(reinos)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list reinos', cause: error }))
    }
  }

  async findById(id: string): Promise<Either<Error, Reino | undefined>> {
    try {
      const row = await this.knex<ReinoRow>('reinos')
        .select(['id', 'nome'])
        .where({ id })
        .first()

      if (!row) {
        return Either.right(undefined)
      }

      return Reino.create({ id: Number(row.id), nome: row.nome })
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find reino', cause: error }))
    }
  }
}
