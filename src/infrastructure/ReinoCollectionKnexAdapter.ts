import { Knex } from 'knex'

import { ReinoNomeDuplicadoError } from '@/domain/reino/error/ReinoNomeDuplicadoError'
import { Attributes, Reino } from '@/domain/reino/Reino'
import { ReinoCollection, ReinoFilters } from '@/domain/reino/ReinoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

function normalizeErrorString(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value.toLowerCase()
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value).toLowerCase()
  }
  return Object.prototype.toString.call(value).toLowerCase()
}

function isDuplicateReinoError(error: unknown): boolean {
  const fields = typeof error === 'object' && error !== null
    ? error as { code?: unknown; detail?: unknown; message?: unknown; constraint?: unknown }
    : {}
  const code = normalizeErrorString(fields.code)
  const details = normalizeErrorString(fields.detail)
  const message = normalizeErrorString(fields.message)
  const constraint = normalizeErrorString(fields.constraint)
  const normalized = [
    code,
    details,
    message,
    constraint
  ].map(normalizeErrorString).join(' ')

  return code === '23505'
    || code === 'ER_DUP_ENTRY'
    || (constraint.includes('reinos') && constraint.includes('nome'))
    || details.includes('already exists')
    || message.includes('duplicate key value violates unique constraint')
    || message.includes('duplicate entry')
    || normalized.includes('unique constraint')
    || normalized.includes('already exists')
}

export class ReinoCollectionKnexAdapter implements ReinoCollection {
  private readonly knex: Knex

  constructor({ knex }: Dependencies) {
    this.knex = knex
  }

  async findAll(filters: ReinoFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex<Attributes>('reinos')
        .select(['id', 'nome'])

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      const order = filters.order ?? { column: 'id', direction: 'desc' }
      query.orderBy(order.column, order.direction)

      return Either.right(await query)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list reinos', cause: error }))
    }
  }

  async findById(id: string): Promise<Either<Error, Attributes | undefined>> {
    try {
      const reino = await this.knex<Attributes>('reinos')
        .select(['id', 'nome'])
        .where({ id })
        .first()
      return Either.right(reino)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find reino', cause: error }))
    }
  }

  private async findByNome(nome: string, excludeId?: string): Promise<Either<Error, Attributes | undefined>> {
    try {
      const query = this.knex<Attributes>('reinos')
        .select(['id', 'nome'])
        .whereRaw('LOWER(nome) = LOWER(?)', [nome])

      if (excludeId !== undefined) {
        query.andWhereNot({ id: excludeId })
      }

      return Either.right(await query.first())
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find reino by name', cause: error }))
    }
  }

  async create(attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Reino>> {
    const nome = attributes.nome.trim()
    const existing = await this.findByNome(nome)
    if (existing.left()) {
      return Either.left(existing.value)
    }
    if (existing.value) {
      return Either.left(new ReinoNomeDuplicadoError())
    }

    try {
      const [reino] = await this.knex<Attributes>('reinos')
        .insert({ nome })
        .returning(['id', 'nome']) as Attributes[]

      return Reino.create({ id: String(reino.id), nome: reino.nome })
    } catch (error) {
      if (isDuplicateReinoError(error)) {
        return Either.left(new ReinoNomeDuplicadoError({ cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to create reino', cause: error }))
    }
  }

  async updateById(id: string, attributes: Pick<Attributes, 'nome'>): Promise<Either<Error, Reino | undefined>> {
    const nome = attributes.nome.trim()
    const existing = await this.findByNome(nome, id)
    if (existing.left()) {
      return Either.left(existing.value)
    }
    if (existing.value) {
      return Either.left(new ReinoNomeDuplicadoError())
    }

    try {
      const [reino] = await this.knex<Attributes>('reinos')
        .where({ id })
        .update({ nome })
        .returning(['id', 'nome']) as Attributes[]

      if (!reino) {
        return Either.right(undefined)
      }

      return Reino.create({ id: String(reino.id), nome: reino.nome })
    } catch (error) {
      if (isDuplicateReinoError(error)) {
        return Either.left(new ReinoNomeDuplicadoError({ cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to update reino', cause: error }))
    }
  }
}
