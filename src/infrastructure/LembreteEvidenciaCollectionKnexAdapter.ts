import { Knex } from 'knex'

import { Attributes, CreateAttributes } from '@/domain/lembrete/LembreteEvidencia'
import { LembreteEvidenciaCollection, LembreteEvidenciaFilters } from '@/domain/lembrete/LembreteEvidenciaCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'
import { ForeignKeyViolationError } from './error/ForeignKeyViolationError'
import { toNullableNumber } from './pg-column'
import { PG_FOREIGN_KEY_VIOLATION, pgErrorCode } from './pg-error'

interface Dependencies {
  knex: Knex
}

interface Row {
  id: number
  lembrete_id: number
  nome: string
  arquivo: string
  mime_type: string
  tamanho: number
  data_captura: Date
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
}

const COLUMNS = [
  'id',
  'lembrete_id',
  'nome',
  'arquivo',
  'mime_type',
  'tamanho',
  'data_captura',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by'
]

function toAttributes(row: Row): Attributes {
  return {
    id: row.id,
    lembrete_id: row.lembrete_id,
    nome: row.nome,
    arquivo: row.arquivo,
    mime_type: row.mime_type,
    tamanho: Number(row.tamanho),
    data_captura: row.data_captura,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: toNullableNumber(row.created_by),
    updated_by: toNullableNumber(row.updated_by)
  }
}

function toInfrastructureError(message: string, error: unknown): Error {
  const code = pgErrorCode(error)

  if (code === PG_FOREIGN_KEY_VIOLATION) {
    return new ForeignKeyViolationError({ message: 'Lembrete não encontrado', cause: error })
  }

  return new CollectionError({ message, cause: error })
}

export class LembreteEvidenciaCollectionKnexAdapter implements LembreteEvidenciaCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: LembreteEvidenciaFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex('lembretes_evidencias').select(COLUMNS)

      if (filters.lembrete_id !== undefined) {
        query.where({ lembrete_id: filters.lembrete_id })
      }

      query.orderBy('id', 'desc')

      const rows = await query as Row[]
      return Either.right(rows.map(toAttributes))
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list evidências do lembrete', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const row = await this.knex('lembretes_evidencias').select(COLUMNS).where({ id }).first() as Row | undefined
      return Either.right(row ? toAttributes(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find evidência do lembrete by id', cause: error }))
    }
  }

  async create(attributes: CreateAttributes): Promise<Either<Error, Attributes>> {
    try {
      const [row] = await this.knex('lembretes_evidencias')
        .insert({
          lembrete_id: attributes.lembrete_id,
          nome: attributes.nome,
          arquivo: attributes.arquivo,
          mime_type: attributes.mime_type,
          tamanho: attributes.tamanho,
          data_captura: attributes.data_captura,
          created_by: attributes.created_by,
          updated_by: attributes.created_by
        })
        .returning<Row[]>(COLUMNS)

      return Either.right(toAttributes(row))
    } catch (error) {
      return Either.left(toInfrastructureError('Failed to create evidência do lembrete', error))
    }
  }

  async delete(id: number): Promise<Either<Error, boolean>> {
    try {
      const deletedCount = await this.knex('lembretes_evidencias').where({ id }).delete()
      return Either.right(deletedCount > 0)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to delete evidência do lembrete', cause: error }))
    }
  }
}
