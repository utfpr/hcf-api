import { Knex } from 'knex'

import { Attributes, CreateAttributes } from '@/domain/evidencia/Evidencia'
import { EvidenciaCollection, EvidenciaFilters } from '@/domain/evidencia/EvidenciaCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'
import { toNullableNumber } from './pg-column'

interface Dependencies {
  knex: Knex
}

interface Row {
  id: number
  evento_id: number
  nome: string
  capturado_em: Date
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
}

const COLUMNS = [
  'id',
  'evento_id',
  'nome',
  'capturado_em',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by'
]

function toAttributes(row: Row): Attributes {
  return {
    id: row.id,
    evento_id: row.evento_id,
    nome: row.nome,
    capturado_em: row.capturado_em,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: toNullableNumber(row.created_by),
    updated_by: toNullableNumber(row.updated_by)
  }
}

export class EvidenciaCollectionKnexAdapter implements EvidenciaCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: EvidenciaFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex('evidencias').select(COLUMNS)

      if (filters.evento_id) {
        query.where({ evento_id: filters.evento_id })
      }

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      const order = filters.order ?? { column: 'id' as const, direction: 'desc' as const }
      query.orderBy(order.column, order.direction)

      const rows = await query as Row[]
      return Either.right(rows.map(toAttributes))
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list evidências', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const row = await this.knex('evidencias').select(COLUMNS).where({ id }).first() as Row | undefined
      return Either.right(row ? toAttributes(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find evidência by id', cause: error }))
    }
  }

  async create(attributes: CreateAttributes): Promise<Either<Error, Attributes>> {
    try {
      const [row] = await this.knex('evidencias')
        .insert({
          evento_id: attributes.evento_id,
          nome: attributes.nome,
          capturado_em: attributes.capturado_em,
          created_by: attributes.created_by,
          updated_by: attributes.created_by
        })
        .returning<Row[]>(COLUMNS)

      return Either.right(toAttributes(row))
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to create evidência', cause: error }))
    }
  }
}
