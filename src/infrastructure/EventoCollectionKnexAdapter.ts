import { Knex } from 'knex'

import {
  Attributes, COLETA_FIELDS, ColetaAttributes, CreateAttributes, EventoTipo
} from '@/domain/evento/Evento'
import {
  AtualizarEventoAttributes, EventoCollection, EventoFilters
} from '@/domain/evento/EventoCollection'
import { Either } from '@/library/either/Either'

import { CheckViolationError } from './error/CheckViolationError'
import { CollectionError } from './error/CollectionError'
import { ForeignKeyViolationError } from './error/ForeignKeyViolationError'
import { toNullableNumber } from './pg-column'
import {
  PG_CHECK_VIOLATION, PG_FOREIGN_KEY_VIOLATION, pgErrorCode
} from './pg-error'

interface Dependencies {
  knex: Knex
}

interface Row {
  id: number
  expedicao_id: number
  tipo: EventoTipo
  capturado_em: Date
  latitude: number | null
  longitude: number | null
  altitude: number | null
  observacoes: string | null
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
  coleta_evento_id: number | null
}

function toAttributes(row: Row & Record<string, unknown>): Attributes {
  let coleta: ColetaAttributes | null = null

  if (row.coleta_evento_id !== null) {
    coleta = Object.fromEntries(
      COLETA_FIELDS.map(campo => [campo, row[`coleta_${campo}`] ?? null])
    ) as unknown as ColetaAttributes
  }

  return {
    id: row.id,
    expedicao_id: row.expedicao_id,
    tipo: row.tipo,
    capturado_em: row.capturado_em,
    latitude: row.latitude,
    longitude: row.longitude,
    altitude: row.altitude,
    observacoes: row.observacoes,
    coleta,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: toNullableNumber(row.created_by),
    updated_by: toNullableNumber(row.updated_by)
  }
}

function toInfrastructureError(message: string, error: unknown): Error {
  const code = pgErrorCode(error)

  if (code === PG_FOREIGN_KEY_VIOLATION) {
    return new ForeignKeyViolationError({ message: 'Expedição não encontrada', cause: error })
  }

  if (code === PG_CHECK_VIOLATION) {
    return new CheckViolationError({ message: 'tipo deve ser "DIARIO" ou "COLETA"', cause: error })
  }

  return new CollectionError({ message, cause: error })
}

export class EventoCollectionKnexAdapter implements EventoCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  private select(trx?: Knex.Transaction): Knex.QueryBuilder {
    const knex = trx ?? this.knex

    return knex('eventos')
      .leftJoin('eventos_coletas', 'eventos_coletas.evento_id', 'eventos.id')
      .select([
        'eventos.id',
        'eventos.expedicao_id',
        'eventos.tipo',
        'eventos.capturado_em',
        'eventos.latitude',
        'eventos.longitude',
        'eventos.altitude',
        'eventos.observacoes',
        'eventos.created_at',
        'eventos.updated_at',
        'eventos.created_by',
        'eventos.updated_by',
        'eventos_coletas.evento_id as coleta_evento_id',
        ...COLETA_FIELDS.map(campo => `eventos_coletas.${campo} as coleta_${campo}`)
      ])
  }

  async findAll(filters: EventoFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.select()

      if (filters.expedicao_id) {
        query.where('eventos.expedicao_id', filters.expedicao_id)
      }

      if (filters.tipo) {
        query.where('eventos.tipo', filters.tipo)
      }

      if (filters.capturado_de) {
        query.where('eventos.capturado_em', '>=', filters.capturado_de)
      }

      if (filters.capturado_ate) {
        query.where('eventos.capturado_em', '<=', filters.capturado_ate)
      }

      const order = filters.order ?? { column: 'capturado_em' as const, direction: 'desc' as const }
      query.orderBy(`eventos.${order.column}`, order.direction)

      const rows = await query as Array<Row & Record<string, unknown>>
      return Either.right(rows.map(toAttributes))
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list eventos', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const row = await this.select()
        .where('eventos.id', id)
        .first() as (Row & Record<string, unknown>) | undefined

      return Either.right(row ? toAttributes(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find evento by id', cause: error }))
    }
  }

  /**
   * O evento e sua ficha nascem juntos ou não nascem: é a transação que garante
   * que todo tipo='COLETA' tem linha em `eventos_coletas`.
   */
  async create(attributes: CreateAttributes): Promise<Either<Error, Attributes>> {
    try {
      const created = await this.knex.transaction(async trx => {
        const [{ id }] = await trx('eventos')
          .insert({
            expedicao_id: attributes.expedicao_id,
            tipo: attributes.tipo,
            capturado_em: attributes.capturado_em,
            latitude: attributes.latitude,
            longitude: attributes.longitude,
            altitude: attributes.altitude,
            observacoes: attributes.observacoes,
            created_by: attributes.created_by,
            updated_by: attributes.created_by
          })
          .returning<Array<{ id: number }>>(['id'])

        if (attributes.coleta) {
          await trx('eventos_coletas').insert({ evento_id: id, ...attributes.coleta })
        }

        return await this.select(trx)
          .where('eventos.id', id)
          .first() as Row & Record<string, unknown>
      })

      return Either.right(toAttributes(created))
    } catch (error) {
      return Either.left(toInfrastructureError('Failed to create evento', error))
    }
  }

  /**
   * O PUT do agregado: trocar tipo de COLETA para DIARIO apaga a ficha; o
   * caminho inverso cria a ficha; manter o tipo e mandar `coleta` faz upsert
   * (evento_id é PK de eventos_coletas).
   */
  async update(id: number, attributes: AtualizarEventoAttributes): Promise<Either<Error, Attributes | null>> {
    try {
      const updated = await this.knex.transaction(async trx => {
        const updatedRows = await trx('eventos')
          .where({ id })
          .update({
            tipo: attributes.tipo,
            capturado_em: attributes.capturado_em,
            latitude: attributes.latitude,
            longitude: attributes.longitude,
            altitude: attributes.altitude,
            observacoes: attributes.observacoes,
            updated_by: attributes.updated_by,
            updated_at: trx.fn.now()
          })
          .returning<Array<{ id: number }>>(['id'])

        if (updatedRows.length === 0) {
          return null
        }

        if (attributes.coleta) {
          await trx('eventos_coletas')
            .insert({ evento_id: id, ...attributes.coleta })
            .onConflict('evento_id')
            .merge()
        } else {
          await trx('eventos_coletas').where({ evento_id: id }).delete()
        }

        return await this.select(trx)
          .where('eventos.id', id)
          .first() as (Row & Record<string, unknown>) | undefined
      })

      return Either.right(updated ? toAttributes(updated) : null)
    } catch (error) {
      return Either.left(toInfrastructureError('Failed to update evento', error))
    }
  }

  /**
   * ON DELETE CASCADE de eventos_coletas.evento_id cuida da ficha; impedindo
   * limpeza duplicada.
   */
  async delete(id: number): Promise<Either<Error, boolean>> {
    try {
      const deletedCount = await this.knex('eventos').where({ id }).delete()
      return Either.right(deletedCount > 0)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to delete evento', cause: error }))
    }
  }
}
