import { Knex } from 'knex'

import { EstadoDoPaisAttributes, PaisCollection, PaisFilters } from '@/domain/pais/PaisCollection'
import { Attributes } from '@/domain/pais/Pais'
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
        .select('id', 'nome', 'sigla')
        .orderBy('nome')

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      return Either.right(await query)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list países', cause: error }))
    }
  }

  async findEstadosBySigla(
    params: { sigla: string },
  ): Promise<Either<Error, EstadoDoPaisAttributes[]>> {
    try {
      const rows = await this.knex('estados')
        .select('id', 'nome', 'sigla')
        .where('paises_sigla', params.sigla)
        .orderBy('nome') as EstadoDoPaisAttributes[]

      return Either.right(rows)
    } catch (error) {
      return Either.left(
        new CollectionError({ message: 'Failed to list estados do país', cause: error }),
      )
    }
  }
}
