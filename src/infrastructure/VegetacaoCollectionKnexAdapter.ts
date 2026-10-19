import { Knex } from 'knex'

import { VegetacaoEmUsoError } from '@/domain/vegetacao/error/VegetacaoEmUsoError'
import { VegetacaoJaExisteError } from '@/domain/vegetacao/error/VegetacaoJaExisteError'
import { Attributes, Vegetacao } from '@/domain/vegetacao/Vegetacao'
import { VegetacaoCollection, VegetacaoFilters } from '@/domain/vegetacao/VegetacaoCollection'
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

function isDuplicateVegetacaoError(error: unknown): boolean {
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
  const normalized = [
    code,
    details,
    message,
    constraint
  ].map(normalizeErrorString).join(' ')

  return code === '23505'
    || code === 'ER_DUP_ENTRY'
    || (constraint.toLowerCase().includes('vegetacoes') && constraint.toLowerCase().includes('nome'))
    || details.toLowerCase().includes('already exists')
    || message.toLowerCase().includes('duplicate key value violates unique constraint')
    || message.toLowerCase().includes('duplicate entry')
    || normalized.includes('unique constraint')
    || normalized.includes('already exists')
}

function isVegetacaoInUseError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : ''
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: unknown }).message)
    : ''
  const constraint = typeof error === 'object' && error !== null && 'constraint' in error
    ? String((error as { constraint?: unknown }).constraint)
    : ''
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
    || constraint.toLowerCase().includes('vegetacao')
}

interface Dependencies {
  knex: Knex
}

export class VegetacaoCollectionKnexAdapter implements VegetacaoCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  private async findByNome(nome: string, excludeId?: string): Promise<Either<Error, Attributes | undefined>> {
    try {
      const query = this.knex<Attributes>('vegetacoes')
        .select(['id', 'nome'])
        .whereRaw('LOWER(nome) = LOWER(?)', [nome])

      if (excludeId !== undefined) {
        query.andWhereNot({ id: excludeId })
      }

      return Either.right(await query.first())
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Erro ao buscar vegetação por nome', cause: error }))
    }
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

  async findById(id: string): Promise<Either<Error, Attributes | undefined>> {
    try {
      const vegetacao = await this.knex<Attributes>('vegetacoes').select(['id', 'nome']).where({ id }).first()
      return Either.right(vegetacao)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find vegetação', cause: error }))
    }
  }

  async create(data: Pick<Attributes, 'nome'>): Promise<Either<Error, Vegetacao>> {
    const nome = data.nome.trim()

    const existing = await this.findByNome(nome)
    if (existing.left()) {
      return Either.left(existing.value)
    }

    if (existing.value) {
      return Either.left(new VegetacaoJaExisteError())
    }

    try {
      const [vegetacao] = await this.knex<Attributes>('vegetacoes')
        .insert({ nome })
        .returning(['id', 'nome']) as Attributes[]

      return Vegetacao.create({ id: vegetacao.id, nome: vegetacao.nome })
    } catch (error) {
      if (isDuplicateVegetacaoError(error)) {
        return Either.left(new VegetacaoJaExisteError({ cause: error }))
      }

      return Either.left(new CollectionError({ message: 'Erro ao criar vegetação', cause: error }))
    }
  }

  async update(id: string, data: Pick<Attributes, 'nome'>): Promise<Either<Error, Vegetacao | undefined>> {
    const nome = data.nome.trim()

    const existing = await this.findByNome(nome, id)
    if (existing.left()) {
      return Either.left(existing.value)
    }

    if (existing.value) {
      return Either.left(new VegetacaoJaExisteError())
    }

    try {
      const [vegetacao] = await this.knex<Attributes>('vegetacoes')
        .where({ id })
        .update({ nome })
        .returning(['id', 'nome']) as Attributes[]

      if (!vegetacao) {
        return Either.right(undefined)
      }

      return Vegetacao.create({ id: vegetacao.id, nome: vegetacao.nome })
    } catch (error) {
      if (isDuplicateVegetacaoError(error)) {
        return Either.left(new VegetacaoJaExisteError({ cause: error }))
      }

      return Either.left(new CollectionError({ message: 'Erro ao atualizar vegetação', cause: error }))
    }
  }

  async delete(id: string): Promise<Either<Error, boolean>> {
    try {
      const deleted = await this.knex<Attributes>('vegetacoes').where({ id }).delete()
      return Either.right(deleted > 0)
    } catch (error) {
      if (isVegetacaoInUseError(error)) {
        return Either.left(new VegetacaoEmUsoError({ cause: error }))
      }

      return Either.left(new CollectionError({ message: 'Erro ao remover vegetação', cause: error }))
    }
  }
}
