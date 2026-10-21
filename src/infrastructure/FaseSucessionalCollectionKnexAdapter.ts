import { Knex } from 'knex'

import { FaseSucessionalEmUsoError } from '@/domain/faseSucessional/error/FaseSucessionalEmUsoError'
import { FaseSucessionalNomeDuplicadoError } from '@/domain/faseSucessional/error/FaseSucessionalNomeDuplicadoError'
import { Attributes, FaseSucessional } from '@/domain/faseSucessional/FaseSucessional'
import { FaseSucessionalCollection, FaseSucessionalFilters } from '@/domain/faseSucessional/FaseSucessionalCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

const TABLE_NAME = 'fase_sucessional'

type FaseSucessionalRow = { id: string; nome: string }

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
    || (/nome/i.test(constraint) && /fase_sucessional/i.test(constraint))
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
    || /fase_sucessional/i.test(constraint)
}

function toEntity(row: FaseSucessionalRow): Either<Error, FaseSucessional> {
  const created = FaseSucessional.create({ id: row.id, nome: row.nome })
  if (created.left()) {
    return created
  }

  if (created.value.id === undefined) {
    return Either.left(new CollectionError({ message: 'Fase sucessional persistida sem id' }))
  }

  return created
}

interface Dependencies {
  knex: Knex
}

export class FaseSucessionalCollectionKnexAdapter implements FaseSucessionalCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: FaseSucessionalFilters): Promise<Either<Error, FaseSucessional[]>> {
    try {
      const query = this.knex<FaseSucessionalRow>(TABLE_NAME)
        .select(['id', 'nome'])

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      if (filters.order) {
        query.orderBy(filters.order.column, filters.order.direction)
      } else {
        query.orderBy('id', 'desc')
      }

      const rows = await query
      const mapped: FaseSucessional[] = []

      for (const row of rows) {
        const entity = toEntity(row)
        if (entity.left()) {
          return entity
        }
        mapped.push(entity.value)
      }

      return Either.right(mapped)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list fases sucessionais', cause: error }))
    }
  }

  async findById(id: string): Promise<Either<Error, FaseSucessional | undefined>> {
    try {
      const faseSucessional = await this.knex<FaseSucessionalRow>(TABLE_NAME)
        .select(['id', 'nome'])
        .where({ id })
        .first()

      if (!faseSucessional) {
        return Either.right(undefined)
      }

      return toEntity(faseSucessional)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find fase sucessional by id', cause: error }))
    }
  }

  async findByNome(nome: string): Promise<Either<Error, FaseSucessional | undefined>> {
    try {
      const faseSucessional = await this.knex<FaseSucessionalRow>(TABLE_NAME)
        .select(['id', 'nome'])
        .whereRaw('LOWER(nome) = LOWER(?)', [nome.trim()])
        .first()

      if (!faseSucessional) {
        return Either.right(undefined)
      }

      return toEntity(faseSucessional)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find fase sucessional by name', cause: error }))
    }
  }

  async create({ nome }: Pick<Attributes, 'nome'>): Promise<Either<Error, FaseSucessional>> {
    try {
      const createdRows = await this.knex<FaseSucessionalRow>(TABLE_NAME)
        .insert({ nome: nome.trim() })
        .returning(['id', 'nome']) as unknown as FaseSucessionalRow[]
      const [created] = createdRows

      if (!created) {
        return Either.left(new CollectionError({ message: 'Failed to create fase sucessional' }))
      }

      return toEntity(created)
    } catch (error) {
      if (isDuplicateFaseSucessionalError(error)) {
        return Either.left(new FaseSucessionalNomeDuplicadoError({ cause: error }))
      }

      return Either.left(new CollectionError({ message: 'Failed to create fase sucessional', cause: error }))
    }
  }

  async update(id: string, { nome }: Pick<Attributes, 'nome'>): Promise<Either<Error, FaseSucessional | undefined>> {
    try {
      const updatedRows = await this.knex<FaseSucessionalRow>(TABLE_NAME)
        .where({ id })
        .update({ nome: nome.trim() })
        .returning(['id', 'nome']) as unknown as FaseSucessionalRow[]
      const [updated] = updatedRows

      if (!updated) {
        return Either.right(undefined)
      }

      return toEntity(updated)
    } catch (error) {
      if (isDuplicateFaseSucessionalError(error)) {
        return Either.left(new FaseSucessionalNomeDuplicadoError({ cause: error }))
      }

      return Either.left(new CollectionError({ message: 'Failed to update fase sucessional', cause: error }))
    }
  }

  async delete(id: string): Promise<Either<Error, boolean>> {
    try {
      const existing = await this.knex<FaseSucessionalRow>(TABLE_NAME)
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

      const deleted = await this.knex(TABLE_NAME)
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
