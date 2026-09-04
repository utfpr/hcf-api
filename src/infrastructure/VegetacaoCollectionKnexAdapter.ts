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
      return Either.left(new CollectionError({ message: 'Já existe uma vegetação com esse nome' }))
    }

    try {
      const [vegetacao] = await this.knex<Attributes>('vegetacoes')
        .insert({ nome })
        .returning(['id', 'nome']) as Attributes[]

      return Either.right(vegetacao)
    } catch (error) {
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
      return Either.left(new CollectionError({ message: 'Já existe uma vegetação com esse nome' }))
    }

    try {
      const [vegetacao] = await this.knex<Attributes>('vegetacoes')
        .where({ id })
        .update({ nome })
        .returning(['id', 'nome']) as Attributes[]

      return Either.right(vegetacao ?? null)
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error))
      return Either.left(new CollectionError({ message: cause.message, cause }))
    }
  }

  async delete(id: number): Promise<Either<Error, boolean>> {
    try {
      const deleted = await this.knex<Attributes>('vegetacoes').where({ id }).delete()
      return Either.right(deleted > 0)
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error))
      return Either.left(new CollectionError({ message: cause.message, cause }))
    }
  }
}
