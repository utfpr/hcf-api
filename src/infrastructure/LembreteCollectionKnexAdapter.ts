import { Knex } from 'knex'

import {
  Attributes, CreateAttributes, FICHA_FIELDS, FichaAttributes, UpdateAttributes
} from '@/domain/lembrete/Lembrete'
import {
  LembreteCollection, LembreteFilters, Paginated
} from '@/domain/lembrete/LembreteCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'
import { ForeignKeyViolationError } from './error/ForeignKeyViolationError'
import { toNullableNumber } from './pg-column'
import { PG_FOREIGN_KEY_VIOLATION, pgErrorCode } from './pg-error'

interface Dependencies {
  knex: Knex
}

interface Row extends FichaAttributes {
  id: number
  data_coleta: string
  local_coleta: string
  descricao: string | null
  latitude: number | null
  longitude: number | null
  expedicao_id: number | null
  client_uuid: string | null
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
}

function toAttributes(row: Row): Attributes {
  return {
    id: row.id,
    data_coleta: row.data_coleta,
    local_coleta: row.local_coleta,
    descricao: row.descricao,
    latitude: row.latitude,
    longitude: row.longitude,
    ...Object.fromEntries(FICHA_FIELDS.map(campo => [campo, row[campo] ?? null])) as unknown as FichaAttributes,
    expedicao_id: row.expedicao_id,
    client_uuid: row.client_uuid,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: toNullableNumber(row.created_by),
    updated_by: toNullableNumber(row.updated_by)
  }
}

// Nome que o Knex dá à FK criada na migração 20261021120000
const FK_EXPEDICAO = 'lembretes_expedicao_id_foreign'

function violouExpedicao(error: unknown): boolean {
  return pgErrorCode(error) === PG_FOREIGN_KEY_VIOLATION
    && (error as { constraint?: unknown }).constraint === FK_EXPEDICAO
}

export class LembreteCollectionKnexAdapter implements LembreteCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  private select(trx?: Knex.Transaction): Knex.QueryBuilder {
    const knex = trx ?? this.knex

    return knex('lembretes')
      .select([
        'lembretes.id',
        // `date` sem conversão vira Date em meia-noite local; devolve como YYYY-MM-DD
        knex.raw('to_char(lembretes.data_coleta, \'YYYY-MM-DD\') as data_coleta'),
        'lembretes.local_coleta',
        'lembretes.descricao',
        'lembretes.latitude',
        'lembretes.longitude',
        ...FICHA_FIELDS.map(campo => `lembretes.${campo}`),
        'lembretes.expedicao_id',
        'lembretes.client_uuid',
        'lembretes.created_at',
        'lembretes.updated_at',
        'lembretes.created_by',
        'lembretes.updated_by'
      ])
  }

  async findAll(filters: LembreteFilters): Promise<Either<Error, Paginated<Attributes>>> {
    try {
      const query = this.select()

      if (filters.expedicao_id) {
        query.where('lembretes.expedicao_id', filters.expedicao_id)
      }

      if (filters.data_coleta_de) {
        query.where('lembretes.data_coleta', '>=', filters.data_coleta_de)
      }

      if (filters.data_coleta_ate) {
        query.where('lembretes.data_coleta', '<=', filters.data_coleta_ate)
      }

      const countRows = await query.clone()
        .clearSelect()
        .count<Array<{ count: string }>>('* as count')
      const [{ count }] = countRows

      const limite = filters.limite && filters.limite > 0 ? filters.limite : 20
      const pagina = filters.pagina && filters.pagina > 0 ? filters.pagina : 1
      const offset = (pagina - 1) * limite

      // Padrão: o lembrete mais próximo primeiro
      const order = filters.order ?? { column: 'data_coleta', direction: 'asc' }
      query.orderBy(`lembretes.${order.column}`, order.direction)
      query.orderBy('lembretes.id', order.direction)
      query.limit(limite).offset(offset)

      const rows = await query as Row[]
      return Either.right({
        itens: rows.map(toAttributes),
        total: Number(count),
        limite,
        pagina
      })
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list lembretes', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const row = await this.select()
        .where('lembretes.id', id)
        .first() as Row | undefined

      return Either.right(row ? toAttributes(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find lembrete by id', cause: error }))
    }
  }

  async findByClientUuid(clientUuid: string): Promise<Either<Error, Attributes | null>> {
    try {
      const row = await this.select()
        .where('lembretes.client_uuid', clientUuid)
        .first() as Row | undefined

      return Either.right(row ? toAttributes(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find lembrete by client_uuid', cause: error }))
    }
  }

  async create(attributes: CreateAttributes): Promise<Either<Error, Attributes>> {
    try {
      const created = await this.knex.transaction(async trx => {
        const [{ id }] = await trx('lembretes')
          .insert({
            ...attributes,
            updated_by: attributes.created_by
          })
          .returning<Array<{ id: number }>>(['id'])

        return await this.select(trx)
          .where('lembretes.id', id)
          .first() as Row
      })

      return Either.right(toAttributes(created))
    } catch (error) {
      if (violouExpedicao(error)) {
        return Either.left(new ForeignKeyViolationError({ message: 'Expedição não encontrada', cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to create lembrete', cause: error }))
    }
  }

  async update(id: number, attributes: UpdateAttributes): Promise<Either<Error, Attributes | null>> {
    try {
      const updated = await this.knex.transaction(async trx => {
        const updatedRows = await trx('lembretes')
          .where({ id })
          .update({
            ...attributes,
            updated_at: trx.fn.now()
          })
          .returning<Array<{ id: number }>>(['id'])

        if (updatedRows.length === 0) {
          return null
        }

        return await this.select(trx)
          .where('lembretes.id', id)
          .first() as Row | undefined
      })

      return Either.right(updated ? toAttributes(updated) : null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to update lembrete', cause: error }))
    }
  }

  async delete(id: number): Promise<Either<Error, boolean>> {
    try {
      const deletedCount = await this.knex('lembretes').where({ id }).delete()
      return Either.right(deletedCount > 0)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to delete lembrete', cause: error }))
    }
  }
}
