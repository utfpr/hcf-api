import { Knex } from 'knex'

import { Attributes } from '@/domain/vegetacao/Vegetacao'
import { VegetacaoCollection, VegetacaoFilters } from '@/domain/vegetacao/VegetacaoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

export class VegetacaoCollectionKnexAdapter implements VegetacaoCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: VegetacaoFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex<Attributes>('vegetacoes')
        .select(['id', 'nome'])

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      const order = filters.order ?? { column: 'id', direction: 'desc' }
      query.orderBy(order.column, order.direction)

      return Either.right(await query)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list vegetações', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const vegetacao = await this.knex<Attributes>('vegetacoes').select(['id', 'nome']).where({ id }).first()
      return Either.right(vegetacao ?? null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find vegetação', cause: error }))
    }
  }
}
