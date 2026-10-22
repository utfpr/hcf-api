import { Knex } from 'knex'

import { RelevoEmUsoError } from '@/domain/relevo/error/RelevoEmUsoError'
import { RelevoNomeDuplicadoError } from '@/domain/relevo/error/RelevoNomeDuplicadoError'
import { Attributes, Relevo } from '@/domain/relevo/Relevo'
import { RelevoCollection, RelevoFilters } from '@/domain/relevo/RelevoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

function normalizeErrorString(value: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }

  if (typeof value === 'string') {
    return value.toLowerCase()
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value).toLowerCase()
  }

  return Object.prototype.toString.call(value).toLowerCase()
}

function errorFields(error: unknown): { code: string; details: string; message: string; constraint: string } {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : ''
  const details = typeof error === 'object' && error !== null && 'detail' in error
    ? String((error as { detail?: unknown }).detail)
    : ''
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: unknown }).message)
    : ''
  const constraint = typeof error === 'object' && error !== null && 'constraint' in error
    ? String((error as { constraint?: unknown }).constraint)
    : ''

  return {
    code, details, message, constraint
  }
}

function isDuplicateRelevoError(error: unknown): boolean {
  const {
    code, details, message, constraint
  } = errorFields(error)
  const normalized = [
    code,
    details,
    message,
    constraint
  ].map(normalizeErrorString).join(' ')

  return code === '23505'
    || code === 'ER_DUP_ENTRY'
    || (constraint.toLowerCase().includes('relevos') && constraint.toLowerCase().includes('nome'))
    || details.toLowerCase().includes('already exists')
    || message.toLowerCase().includes('duplicate key value violates unique constraint')
    || message.toLowerCase().includes('duplicate entry')
    || normalized.includes('unique constraint')
    || normalized.includes('already exists')
}

function isRelevoInUseError(error: unknown): boolean {
  const {
    code,
    message,
    constraint
  } = errorFields(error)
  const normalized = [
    code,
    message,
    constraint
  ].map(normalizeErrorString).join(' ')

  return code === '23503'
    || code === 'ER_ROW_IS_REFERENCED_2'
    || normalized.includes('violates foreign key constraint')
    || normalized.includes('is still referenced from table')
    || normalized.includes('cannot delete or update a parent row')
    || normalized.includes('foreign key constraint fails')
    || normalized.includes('still referenced')
    || constraint.toLowerCase().includes('relevo')
}

interface Dependencies {
  knex: Knex
}

export class RelevoCollectionKnexAdapter implements RelevoCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  private async findByNome(nome: string, excludeId?: string): Promise<Either<Error, Attributes | undefined>> {
    try {
      const query = this.knex<Attributes>('relevos')
        .select(['id', 'nome'])
        .whereRaw('LOWER(nome) = LOWER(?)', [nome])

      if (excludeId !== undefined) {
        query.andWhereNot({ id: excludeId })
      }

      return Either.right(await query.first())
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find relevo by name', cause: error }))
    }
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

  async findById(id: string): Promise<Either<Error, Attributes | undefined>> {
    try {
      const relevo = await this.knex<Attributes>('relevos').select(['id', 'nome']).where({ id }).first()
      return Either.right(relevo)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find relevo', cause: error }))
    }
  }

  async create(attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Relevo>> {
    const nome = attributes.nome.trim()

    const existing = await this.findByNome(nome)
    if (existing.left()) {
      return Either.left(existing.value)
    }

    if (existing.value) {
      return Either.left(new RelevoNomeDuplicadoError())
    }

    try {
      const [relevo] = await this.knex<Attributes>('relevos')
        .insert({ nome })
        .returning(['id', 'nome']) as Attributes[]

      return Relevo.create({ id: String(relevo.id), nome: relevo.nome })
    } catch (error) {
      if (isDuplicateRelevoError(error)) {
        return Either.left(new RelevoNomeDuplicadoError({ cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to create relevo', cause: error }))
    }
  }

  async updateById(id: string, attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Relevo | undefined>> {
    const nome = attributes.nome.trim()

    const existing = await this.findByNome(nome, id)
    if (existing.left()) {
      return Either.left(existing.value)
    }

    if (existing.value) {
      return Either.left(new RelevoNomeDuplicadoError())
    }

    try {
      const [relevo] = await this.knex<Attributes>('relevos')
        .where({ id })
        .update({ nome })
        .returning(['id', 'nome']) as Attributes[]

      if (!relevo) {
        return Either.right(undefined)
      }

      return Relevo.create({ id: String(relevo.id), nome: relevo.nome })
    } catch (error) {
      if (isDuplicateRelevoError(error)) {
        return Either.left(new RelevoNomeDuplicadoError({ cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to update relevo', cause: error }))
    }
  }

  async deleteById(id: string): Promise<Either<Error, boolean>> {
    try {
      const deleted = await this.knex('relevos').where({ id }).delete()
      return Either.right(deleted > 0)
    } catch (error) {
      if (isRelevoInUseError(error)) {
        return Either.left(new RelevoEmUsoError({ cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to delete relevo', cause: error }))
    }
  }

  async countTomboReferences(id: string): Promise<Either<Error, number>> {
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
