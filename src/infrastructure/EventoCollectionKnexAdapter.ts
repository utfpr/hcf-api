import { Knex } from 'knex'

import {
  Attributes, COLETA_FIELDS, ColetaAttributes, CreateAttributes, EventoTipo
} from '@/domain/evento/Evento'
import {
  AtualizaEventoAttributes, EventoCollection, EventoFilters, Paginated
} from '@/domain/evento/EventoCollection'
import { Either } from '@/library/either/Either'

import { CheckViolationError } from './error/CheckViolationError'
import { CollectionError } from './error/CollectionError'
import { ForeignKeyViolationError } from './error/ForeignKeyViolationError'
import { toNullableNumber } from './pg-column'
import {
  PG_CHECK_VIOLATION, PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION, pgErrorCode
} from './pg-error'

interface Dependencies {
  knex: Knex
}

interface Row {
  id: number
  expedicao_id: number
  tipo: EventoTipo
  data_captura: Date
  latitude: number | null
  longitude: number | null
  altitude: number | null
  observacoes: string | null
  numero_coleta: string | null
  client_uuid: string | null
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
    data_captura: row.data_captura,
    latitude: row.latitude,
    longitude: row.longitude,
    altitude: row.altitude,
    observacoes: row.observacoes,
    coleta,
    numero_coleta: row.numero_coleta,
    client_uuid: row.client_uuid,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: toNullableNumber(row.created_by),
    updated_by: toNullableNumber(row.updated_by)
  }
}

function juntarTexto(atual: string | null, novo: string | null): string | null {
  if (!novo?.trim()) return atual
  if (!atual?.trim()) return novo
  if (atual.includes(novo)) return atual
  return `${atual}\n\n${novo}`
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
        'eventos.data_captura',
        'eventos.latitude',
        'eventos.longitude',
        'eventos.altitude',
        'eventos.observacoes',
        'eventos.numero_coleta',
        'eventos.client_uuid',
        'eventos.created_at',
        'eventos.updated_at',
        'eventos.created_by',
        'eventos.updated_by',
        'eventos_coletas.evento_id as coleta_evento_id',
        ...COLETA_FIELDS.map(campo => `eventos_coletas.${campo} as coleta_${campo}`)
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

      if (filters.data_captura_de) {
        query.where('eventos.data_captura', '>=', filters.data_captura_de)
      }

      if (filters.data_captura_ate) {
        query.where('eventos.data_captura', '<=', filters.data_captura_ate)
      }

      const countQuery = query.clone()

      const countRows = await countQuery
        .clearSelect()
        .count<Array<{ count: string }>>('* as count')
      const [{ count }] = countRows

      const limite = filters.limite && filters.limite > 0 ? filters.limite : 20
      const pagina = filters.pagina && filters.pagina > 0 ? filters.pagina : 1
      const offset = (pagina - 1) * limite

      query.orderBy('eventos.data_captura', 'desc')
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

  async findByClientUuid(clientUuid: string): Promise<Either<Error, Attributes | null>> {
    try {
      // Também reconhece envios que foram juntados a uma coleta já existente
      const row = await this.select()
        .where('eventos.client_uuid', clientUuid)
        .orWhereIn('eventos.id', this.knex('eventos_envios').select('evento_id').where({ client_uuid: clientUuid }))
        .first() as (Row & Record<string, unknown>) | undefined

      return Either.right(row ? toAttributes(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find evento by client_uuid', cause: error }))
    }
  }

  /**
   * O evento e sua ficha nascem juntos ou não nascem: é a transação que garante
   * que todo tipo='COLETA' tem linha em `eventos_coletas`.
   *
   * COLETA com número que já existe na expedição não cria outro evento: junta
   * neste (é a mesma coleta, registrada por outra pessoa/aparelho). Cada envio
   * fica em `eventos_envios`, para o reenvio ser reconhecido.
   */
  async create(attributes: CreateAttributes): Promise<Either<Error, Attributes>> {
    try {
      const created = await this.knex.transaction(async trx => {
        const numero = attributes.tipo === 'COLETA' ? attributes.numero_coleta ?? null : null
        let id: number

        if (numero) {
          const existente = await this.travarColeta(trx, attributes.expedicao_id, numero)
          if (existente) {
            id = existente
            await this.juntarColeta(trx, id, attributes)
          } else {
            // Outro celular pode ter criado o mesmo número entre a busca e o insert:
            // o insert vai num savepoint, e a violação do índice único vira "junta"
            const inserido = await trx.transaction(savepoint => this.inserir(savepoint, attributes, numero))
              .catch((error: unknown) => {
                if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) return null
                throw error
              })
            if (inserido) {
              id = inserido
            } else {
              id = await this.travarColeta(trx, attributes.expedicao_id, numero) as number
              await this.juntarColeta(trx, id, attributes)
            }
          }
        } else {
          id = await this.inserir(trx, attributes, null)
        }

        if (attributes.client_uuid) {
          await trx('eventos_envios')
            .insert({
              client_uuid: attributes.client_uuid, evento_id: id, created_by: attributes.created_by
            })
            .onConflict('client_uuid')
            .ignore()
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

  private async inserir(trx: Knex.Transaction, attributes: CreateAttributes, numero: string | null): Promise<number> {
    const [{ id }] = await trx('eventos')
      .insert({
        expedicao_id: attributes.expedicao_id,
        tipo: attributes.tipo,
        data_captura: attributes.data_captura,
        latitude: attributes.latitude,
        longitude: attributes.longitude,
        altitude: attributes.altitude,
        observacoes: attributes.observacoes,
        numero_coleta: numero,
        client_uuid: attributes.client_uuid ?? null,
        created_by: attributes.created_by,
        updated_by: attributes.created_by
      })
      .returning<Array<{ id: number }>>(['id'])

    if (attributes.coleta) {
      await trx('eventos_coletas').insert({ evento_id: id, ...attributes.coleta })
    }

    return id
  }

  /** Id da coleta com esse número na expedição, com a linha travada até o fim da transação */
  private async travarColeta(trx: Knex.Transaction, expedicaoId: number, numero: string): Promise<number | null> {
    const row = await trx('eventos')
      .select('id')
      .where({ expedicao_id: expedicaoId, numero_coleta: numero })
      .forUpdate()
      .first() as { id: number } | undefined
    return row?.id ?? null
  }

  /**
   * Junta um novo registro da mesma coleta: só preenche o que ainda está vazio
   * (não sobrescreve o que outra pessoa já anotou), acrescenta as observações e
   * fica com o instante de captura mais antigo.
   */
  private async juntarColeta(trx: Knex.Transaction, id: number, novo: CreateAttributes): Promise<void> {
    const atual = toAttributes(await this.select(trx).where('eventos.id', id).first() as Row & Record<string, unknown>)
    const semCoordenadas = atual.latitude === null && atual.longitude === null

    await trx('eventos')
      .where({ id })
      .update({
        data_captura: novo.data_captura < atual.data_captura ? novo.data_captura : atual.data_captura,
        latitude: semCoordenadas ? novo.latitude : atual.latitude,
        longitude: semCoordenadas ? novo.longitude : atual.longitude,
        altitude: atual.altitude ?? novo.altitude,
        observacoes: juntarTexto(atual.observacoes, novo.observacoes),
        updated_by: novo.created_by,
        updated_at: trx.fn.now()
      })

    const fichaNova = novo.coleta
    if (!fichaNova) return

    const fichaAtual = atual.coleta
    const ficha = Object.fromEntries(COLETA_FIELDS.map(campo => {
      const valorAtual = fichaAtual?.[campo]
      const preenchido = valorAtual !== null && valorAtual !== undefined && valorAtual.trim() !== ''
      return [campo, preenchido ? valorAtual : fichaNova[campo] ?? null]
    }))

    await trx('eventos_coletas')
      .insert({ evento_id: id, ...ficha })
      .onConflict('evento_id')
      .merge()
  }

  /**
   * O PUT do agregado: trocar tipo de COLETA para DIARIO apaga a ficha; o
   * caminho inverso cria a ficha; manter o tipo e mandar `coleta` faz upsert
   * (evento_id é PK de eventos_coletas).
   */
  async update(id: number, attributes: AtualizaEventoAttributes): Promise<Either<Error, Attributes | null>> {
    try {
      const updated = await this.knex.transaction(async trx => {
        const updatedRows = await trx('eventos')
          .where({ id })
          .update({
            tipo: attributes.tipo,
            data_captura: attributes.data_captura,
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
