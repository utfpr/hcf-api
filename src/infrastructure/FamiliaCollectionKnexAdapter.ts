import { Knex } from 'knex'

import { Familia } from '@/domain/familia/Familia'
import { FamiliaCollection, FamiliaFilters } from '@/domain/familia/FamiliaCollection'
import { Reino } from '@/domain/reino/Reino'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

interface FamiliaRow {
  id: number | string
  nome: string
  reino_id: number | string | null
  reino_nome: string | null
}

const orderColumns = {
  id: 'familias.id',
  nome: 'familias.nome',
  reino: 'reinos.nome'
} as const

export class FamiliaCollectionKnexAdapter implements FamiliaCollection {
  private readonly knex: Knex

  constructor({ knex }: Dependencies) {
    this.knex = knex
  }

  async findAll(filters: FamiliaFilters): Promise<Either<Error, Familia[]>> {
    try {
      const query = this.query(filters)

      const order = filters.order ?? { column: 'id', direction: 'desc' }
      query.orderBy(orderColumns[order.column], order.direction)
      if (order.column !== 'id') {
        query.orderBy('familias.id', 'desc')
      }

      const rows = await query.select(this.columns()) as FamiliaRow[]
      const familias: Familia[] = []
      for (const row of rows) {
        const familia = this.mapRow(row)
        if (familia.left()) {
          return Either.left(familia.value)
        }
        familias.push(familia.value)
      }

      return Either.right(familias)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list familias', cause: error }))
    }
  }

  async findById(id: string): Promise<Either<Error, Familia | undefined>> {
    try {
      const row = await this.query({})
        .where('familias.id', id)
        .select(this.columns())
        .first() as FamiliaRow | undefined

      if (!row) {
        return Either.right(undefined)
      }

      return this.mapRow(row)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find familia', cause: error }))
    }
  }

  private query(filters: FamiliaFilters): Knex.QueryBuilder {
    const query = this.knex('familias')
      .leftJoin('reinos', 'reinos.id', 'familias.reino_id')

    if (filters.nome) {
      query.whereILike('familias.nome', `%${filters.nome}%`)
    }

    if (filters.reino_id !== undefined) {
      query.where('familias.reino_id', filters.reino_id)
    }

    return query
  }

  private columns(): string[] {
    return [
      'familias.id',
      'familias.nome',
      'reinos.id as reino_id',
      'reinos.nome as reino_nome'
    ]
  }

  private mapRow(row: FamiliaRow): Either<Error, Familia> {
    let reino: Reino | null = null
    if (row.reino_id !== null) {
      const entity = Reino.create({ id: Number(row.reino_id), nome: row.reino_nome ?? '' })
      if (entity.left()) {
        return Either.left(entity.value)
      }
      reino = entity.value
    }

    return Familia.create({
      id: Number(row.id),
      nome: row.nome,
      reino
    })
  }
}
