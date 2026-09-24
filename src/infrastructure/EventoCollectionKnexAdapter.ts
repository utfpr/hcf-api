import { Knex } from 'knex'

import {
  Attributes, ColetaAttributes, CreateAttributes, EventoTipo
} from '@/domain/evento/Evento'
import {
  EventoCollection, EventoFilters, Paginated
} from '@/domain/evento/EventoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'
import { toNullableNumber } from './pg-column'

interface Dependencies {
  knex: Knex
}

const CAMPOS_DA_FICHA = [
  'familia',
  'nome_popular',
  'nome_cientifico',
  'municipio',
  'estado',
  'referencia_local',
  'tipo_vegetacao',
  'solo',
  'relevo',
  'substrato',
  'tronco_com_casca',
  'associacoes',
  'folhas',
  'habito',
  'frutos',
  'flores',
  'luminosidade'
] as const

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
      CAMPOS_DA_FICHA.map(campo => [campo, row[`coleta_${campo}`] ?? null])
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
        ...CAMPOS_DA_FICHA.map(campo => `eventos_coletas.${campo} as coleta_${campo}`)
      ])
  }

  async findAll(filters: EventoFilters): Promise<Either<Error, Paginated<Attributes>>> {
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

      const countQuery = query.clone()

      const countRows = await countQuery
        .clearSelect()
        .count<Array<{ count: string }>>('* as count')
      const [{ count }] = countRows

      const limite = filters.limite && filters.limite > 0 ? filters.limite : 20
      const pagina = filters.pagina && filters.pagina > 0 ? filters.pagina : 1
      const offset = (pagina - 1) * limite

      query.orderBy('eventos.capturado_em', 'desc')
      query.orderBy('eventos.id', 'desc')
      query.limit(limite).offset(offset)

      const rows = await query as Array<Row & Record<string, unknown>>
      return Either.right({
        itens: rows.map(toAttributes),
        total: Number(count),
        limite,
        pagina
      })
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
      return Either.left(new CollectionError({ message: 'Failed to create evento', cause: error }))
    }
  }
}
