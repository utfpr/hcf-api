import { Knex } from 'knex'

import { RelevoNomeDuplicadoError } from '@/domain/relevo/error/RelevoNomeDuplicadoError'
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

  async findByNome(nome: string): Promise<Either<Error, Attributes | null>> {
    try {
      const relevo = await this.knex<Attributes>('relevos')
        .select(['id', 'nome'])
        .whereRaw('LOWER(nome) = LOWER(?)', [nome.trim()])
        .first()
      return Either.right(relevo ?? null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find relevo by name', cause: error }))
    }
  }

  async create(attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes>> {
    try {
      const [relevo] = await this.knex<Attributes>('relevos')
        .insert({ nome: attributes.nome })
        .returning(['id', 'nome'])

      return Either.right(relevo)
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return Either.left(new RelevoNomeDuplicadoError({ cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to create relevo', cause: error }))
    }
  }

  async updateById(id: number, attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes | null>> {
    try {
      const [relevo] = await this.knex<Attributes>('relevos')
        .where({ id })
        .update({ nome: attributes.nome })
        .returning(['id', 'nome'])

      return Either.right(relevo ?? null)
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return Either.left(new RelevoNomeDuplicadoError({ cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to update relevo', cause: error }))
    }
  }

  async deleteById(id: number): Promise<Either<Error, boolean>> {
    try {
      const deleted = await this.knex('relevos').where({ id }).delete()
      return Either.right(deleted > 0)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to delete relevo', cause: error }))
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    const pgError = error as { code?: string; message?: string }
    return pgError.code === '23505' || /duplicate key|unique constraint/i.test(pgError.message ?? '')
  }

  async countTomboReferences(id: number): Promise<Either<Error, number>> {
    try {
      const result = await this.knex.raw<{ rows: Array<{ count: string | number }> }>(
        'SELECT COUNT(*)::int AS count FROM tombos WHERE relevo_id = ?',
        [id]
      )

      return Either.right(Number(result.rows[0]?.count ?? 0))
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to count tombos referencing relevo', cause: error }))
    }
  }
}
