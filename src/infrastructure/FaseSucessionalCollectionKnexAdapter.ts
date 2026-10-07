import { Knex } from 'knex'

import { FaseSucessionalEmUsoError } from '@/domain/faseSucessional/error/FaseSucessionalEmUsoError'
import { FaseSucessionalNomeDuplicadoError } from '@/domain/faseSucessional/error/FaseSucessionalNomeDuplicadoError'
import { Attributes } from '@/domain/faseSucessional/FaseSucessional'
import { FaseSucessionalCollection, FaseSucessionalFilters } from '@/domain/faseSucessional/FaseSucessionalCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

function isDuplicateFaseSucessionalError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : ''
  const detail = typeof error === 'object' && error !== null && 'detail' in error
    ? String((error as { detail?: unknown }).detail)
    : ''
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: unknown }).message)
    : ''
  const constraint = typeof error === 'object' && error !== null && 'constraint' in error
    ? String((error as { constraint?: unknown }).constraint)
    : ''

  return code === '23505'
    || /duplicate key|already exists|unique constraint/i.test(`${detail} ${message} ${constraint}`)
    || (/nome/i.test(constraint) && /fase/i.test(constraint))
}

function isFaseSucessionalInUseError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : ''
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: unknown }).message)
    : ''
  const constraint = typeof error === 'object' && error !== null && 'constraint' in error
    ? String((error as { constraint?: unknown }).constraint)
    : ''

  return code === '23503'
    || /foreign key|still referenced|cannot delete or update a parent row|violates foreign key constraint/i.test(`${message} ${constraint}`)
    || /fase/i.test(constraint)
}

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

  async findByNome(nome: string): Promise<Either<Error, Attributes | null>> {
    try {
      const tableName = await this.resolveTableName()
      const faseSucessional = await this.knex<Attributes>(tableName)
        .select(['id', 'nome'])
        .whereRaw('LOWER(nome) = LOWER(?)', [nome.trim()])
        .first()

      return Either.right(faseSucessional ?? null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find fase sucessional by name', cause: error }))
    }
  }

  async create({ nome }: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes>> {
    try {
      const tableName = await this.resolveTableName()
      const createdRows = await this.knex<Attributes>(tableName)
        .insert({ nome: nome.trim() })
        .returning(['id', 'nome']) as unknown as Attributes[]
      const [created] = createdRows

      return Either.right(created)
    } catch (error) {
      if (isDuplicateFaseSucessionalError(error)) {
        return Either.left(new FaseSucessionalNomeDuplicadoError({ cause: error }))
      }

      return Either.left(new CollectionError({ message: 'Failed to create fase sucessional', cause: error }))
    }
  }

  async update(id: number, { nome }: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes | null>> {
    try {
      const tableName = await this.resolveTableName()
      const updatedRows = await this.knex<Attributes>(tableName)
        .where({ id })
        .update({ nome: nome.trim() })
        .returning(['id', 'nome']) as unknown as Attributes[]
      const [updated] = updatedRows

      return Either.right(updated ?? null)
    } catch (error) {
      if (isDuplicateFaseSucessionalError(error)) {
        return Either.left(new FaseSucessionalNomeDuplicadoError({ cause: error }))
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

      const inTombos: { id: number } | undefined = await this.knex<{ id: number }>('tombos')
        .where('fase_sucessional_id', id)
        .first()
      const inLocaisColeta: { id: number } | undefined = await this.knex<{ id: number }>('locais_coleta')
        .where(builder => {
          void builder.where('fase_sucessional_id', id)
          void builder.orWhere('fase_numero', id)
        })
        .first()

      if (inTombos || inLocaisColeta) {
        return Either.left(new FaseSucessionalEmUsoError())
      }

      const deleted = await this.knex(tableName)
        .where({ id })
        .delete()

      return Either.right(deleted > 0)
    } catch (error) {
      if (isFaseSucessionalInUseError(error)) {
        return Either.left(new FaseSucessionalEmUsoError({ cause: error }))
      }

      return Either.left(new CollectionError({ message: 'Failed to delete fase sucessional', cause: error }))
    }
  }
}
