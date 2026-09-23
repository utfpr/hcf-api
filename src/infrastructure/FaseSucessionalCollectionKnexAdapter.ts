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

  private async resolveTableName(): Promise<string> {
    const candidates = ['fase_sucessional', 'fases_sucessionais']

    for (const tableName of candidates) {
      try {
        await this.knex(tableName).select('id').limit(1)
        return tableName
      } catch {
        // fallback to next candidate
      }
    }

    return 'fase_sucessional'
  }

  async findAll(filters: FaseSucessionalFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const tableName = await this.resolveTableName()
      const query = this.knex<Attributes>(tableName)
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
      const tableName = await this.resolveTableName()
      const faseSucessional = await this.knex<Attributes>(tableName)
        .select(['id', 'nome'])
        .where({ id })
        .first()

      return Either.right(faseSucessional ?? null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find fase sucessional by id', cause: error }))
    }
  }

  async create({ nome }: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes>> {
    try {
      const tableName = await this.resolveTableName()
      const duplicate = await this.knex<Attributes>(tableName)
        .whereILike('nome', nome.trim())
        .first()

      if (duplicate) {
        return Either.left(new Error('Já existe uma fase sucessional com esse nome'))
      }

      const [created] = await this.knex<Attributes>(tableName)
        .insert({ nome: nome.trim() })
        .returning(['id', 'nome'])

      return Either.right(created)
    } catch (error) {
      if (error instanceof Error && /duplicate|já existe|unique/i.test(error.message)) {
        return Either.left(new Error('Já existe uma fase sucessional com esse nome'))
      }

      return Either.left(new CollectionError({ message: 'Failed to create fase sucessional', cause: error }))
    }
  }

  async update(id: number, { nome }: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes | null>> {
    try {
      const tableName = await this.resolveTableName()
      const existing = await this.knex<Attributes>(tableName)
        .where({ id })
        .first()

      if (!existing) {
        return Either.right(null)
      }

      const duplicate = await this.knex<Attributes>(tableName)
        .whereILike('nome', nome.trim())
        .whereNot({ id })
        .first()

      if (duplicate) {
        return Either.left(new Error('Já existe uma fase sucessional com esse nome'))
      }

      const updatedRows = (await this.knex<Attributes>(tableName)
        .where({ id })
        .update({ nome: nome.trim() })
        .returning(['id', 'nome'])) as unknown as Attributes[]

      const updatedEntity: Attributes = updatedRows[0] ?? { ...existing, nome: nome.trim() }

      return Either.right(updatedEntity)
    } catch (error) {
      if (error instanceof Error && /duplicate|já existe|unique/i.test(error.message)) {
        return Either.left(new Error('Já existe uma fase sucessional com esse nome'))
      }

      return Either.left(new CollectionError({ message: 'Failed to update fase sucessional', cause: error }))
    }
  }

  async delete(id: number): Promise<Either<Error, boolean>> {
    try {
      const tableName = await this.resolveTableName()
      const existing = await this.knex<Attributes>(tableName)
        .where({ id })
        .first()

      if (!existing) {
        return Either.right(false)
      }

      const inUse = await this.knex<{ id: number }>('tombos')
        .where('fase_sucessional_id', id)
        .first()

      if (inUse) {
        return Either.left(new Error('Fase sucessional está em uso e não pode ser removida'))
      }

      await this.knex(tableName)
        .where({ id })
        .delete()

      return Either.right(true)
    } catch (error) {
      if (error instanceof Error && /in use|em uso|foreign key|violat/i.test(error.message)) {
        return Either.left(new Error('Fase sucessional está em uso e não pode ser removida'))
      }

      return Either.left(new CollectionError({ message: 'Failed to delete fase sucessional', cause: error }))
    }
  }
}
