import { Knex } from 'knex'

import { Attributes } from '@/domain/vegetacao/Vegetacao'
import { VegetacaoCollection, VegetacaoFilters } from '@/domain/vegetacao/VegetacaoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

const DUPLICATE_VEGETACAO_MESSAGE = 'Já existe uma vegetação com esse nome'
const VEGETACAO_IN_USE_MESSAGE = 'Vegetação está em uso e não pode ser removida'

function isDuplicateVegetacaoError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : ''
  const details = typeof error === 'object' && error !== null && 'detail' in error ? String((error as { detail?: unknown }).detail) : ''
  const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message) : ''
  const constraint = typeof error === 'object' && error !== null && 'constraint' in error ? String((error as { constraint?: unknown }).constraint) : ''

  return code === '23505'
    || (constraint.toLowerCase().includes('vegetacoes') && constraint.toLowerCase().includes('nome'))
    || details.toLowerCase().includes('already exists')
    || message.toLowerCase().includes('duplicate key value violates unique constraint')
}

function isVegetacaoInUseError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : ''
  const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message) : ''
  const constraint = typeof error === 'object' && error !== null && 'constraint' in error ? String((error as { constraint?: unknown }).constraint) : ''

  return code === '23503'
    || message.toLowerCase().includes('violates foreign key constraint')
    || message.toLowerCase().includes('is still referenced from table')
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

  private async findByNome(nome: string, excludeId?: number): Promise<Either<Error, Attributes | null>> {
    try {
      const query = this.knex<Attributes>('vegetacoes')
        .select(['id', 'nome'])
        .whereRaw('LOWER(nome) = LOWER(?)', [nome])

      if (excludeId !== undefined) {
        query.andWhereNot({ id: excludeId })
      }

      const vegetacao = await query.first()
      return Either.right(vegetacao ?? null)
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error))
      return Either.left(new CollectionError({ message: cause.message, cause }))
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

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const vegetacao = await this.knex<Attributes>('vegetacoes').select(['id', 'nome']).where({ id }).first()
      return Either.right(vegetacao ?? null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find vegetação', cause: error }))
    }
  }

  async create(data: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes>> {
    const nome = data.nome.trim()

    const existing = await this.findByNome(nome)
    if (existing.left()) {
      return Either.left(existing.value)
    }

    if (existing.value) {
      return Either.left(new CollectionError({ message: DUPLICATE_VEGETACAO_MESSAGE }))
    }

    try {
      const [vegetacao] = await this.knex<Attributes>('vegetacoes')
        .insert({ nome })
        .returning(['id', 'nome']) as Attributes[]

      return Either.right(vegetacao)
    } catch (error) {
      if (isDuplicateVegetacaoError(error)) {
        return Either.left(new CollectionError({ message: DUPLICATE_VEGETACAO_MESSAGE, cause: error }))
      }

      const cause = error instanceof Error ? error : new Error(String(error))
      return Either.left(new CollectionError({ message: cause.message, cause }))
    }
  }

  async update(id: number, data: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes | null>> {
    const nome = data.nome.trim()

    const existing = await this.findByNome(nome, id)
    if (existing.left()) {
      return Either.left(existing.value)
    }

    if (existing.value) {
      return Either.left(new CollectionError({ message: DUPLICATE_VEGETACAO_MESSAGE }))
    }

    try {
      const [vegetacao] = await this.knex<Attributes>('vegetacoes')
        .where({ id })
        .update({ nome })
        .returning(['id', 'nome']) as Attributes[]

      return Either.right(vegetacao ?? null)
    } catch (error) {
      if (isDuplicateVegetacaoError(error)) {
        return Either.left(new CollectionError({ message: DUPLICATE_VEGETACAO_MESSAGE, cause: error }))
      }

      const cause = error instanceof Error ? error : new Error(String(error))
      return Either.left(new CollectionError({ message: cause.message, cause }))
    }
  }

  async delete(id: number): Promise<Either<Error, boolean>> {
    try {
      const deleted = await this.knex<Attributes>('vegetacoes').where({ id }).delete()
      return Either.right(deleted > 0)
    } catch (error) {
      if (isVegetacaoInUseError(error)) {
        return Either.left(new CollectionError({ message: VEGETACAO_IN_USE_MESSAGE, cause: error }))
      }

      const cause = error instanceof Error ? error : new Error(String(error))
      return Either.left(new CollectionError({ message: cause.message, cause }))
    }
  }
}
