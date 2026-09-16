import { Knex } from 'knex'

import { Attributes, CreateAttributes } from '@/domain/expedicao/Expedicao'
import { ExpedicaoCollection, ExpedicaoFilters } from '@/domain/expedicao/ExpedicaoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'
import { toNullableNumber, toNumber } from './pg-column'

interface Dependencies {
  knex: Knex
}

interface Row {
  id: number
  descricao: string | null
  data_inicio: string
  data_fim: string
  cidade_id: string
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
}

function toAttributes(row: Row): Attributes {
  return {
    id: row.id,
    descricao: row.descricao,
    data_inicio: row.data_inicio,
    data_fim: row.data_fim,
    cidade_id: toNumber(row.cidade_id),
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: toNullableNumber(row.created_by),
    updated_by: toNullableNumber(row.updated_by)
  }
}

export class ExpedicaoCollectionKnexAdapter implements ExpedicaoCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  private select(trx?: Knex.Transaction): Knex.QueryBuilder {
    const knex = trx ?? this.knex
    return knex('expedicoes').select([
      'expedicoes.id',
      'expedicoes.descricao',
      knex.raw('to_char(expedicoes.data_inicio, \'YYYY-MM-DD\') as data_inicio'),
      knex.raw('to_char(expedicoes.data_fim, \'YYYY-MM-DD\') as data_fim'),
      'expedicoes.cidade_id',
      'expedicoes.created_at',
      'expedicoes.updated_at',
      'expedicoes.created_by',
      'expedicoes.updated_by'
    ])
  }

  async findAll(filters: ExpedicaoFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.select()

      if (filters.cidade_id) {
        query.where('expedicoes.cidade_id', filters.cidade_id)
      }

      if (filters.usuario_id) {
        query.whereIn('expedicoes.id', this.knex('expedicoes_participantes')
          .select('expedicao_id')
          .where('usuario_id', filters.usuario_id))
      }

      if (filters.data_inicio_de) {
        query.where('expedicoes.data_inicio', '>=', filters.data_inicio_de)
      }

      if (filters.data_fim_ate) {
        query.where('expedicoes.data_fim', '<=', filters.data_fim_ate)
      }

      const order = filters.order ?? { column: 'id' as const, direction: 'desc' as const }
      query.orderBy(`expedicoes.${order.column}`, order.direction)

      const rows = await query as Row[]
      return Either.right(rows.map(toAttributes))
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list expedições', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const row = await this.select().where('expedicoes.id', id).first() as Row | undefined
      return Either.right(row ? toAttributes(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find expedição by id', cause: error }))
    }
  }

  /**
   * Escrita multi-tabela: a expedição e suas junções nascem juntas ou não nascem.
   * A posição de cada cidade em `rotas` define a coluna `ordem`.
   */
  async create(attributes: CreateAttributes): Promise<Either<Error, Attributes>> {
    const {
      participantes, rotas, ...expedicao
    } = attributes

    try {
      const created = await this.knex.transaction(async trx => {
        const [{ id }] = await trx('expedicoes')
          .insert({
            descricao: expedicao.descricao,
            data_inicio: expedicao.data_inicio,
            data_fim: expedicao.data_fim,
            cidade_id: expedicao.cidade_id,
            created_by: expedicao.created_by,
            updated_by: expedicao.created_by
          })
          .returning<{ id: number }[]>(['id'])

        if (participantes.length > 0) {
          await trx('expedicoes_participantes').insert(participantes.map(usuarioId => ({
            expedicao_id: id,
            usuario_id: usuarioId,
            created_by: expedicao.created_by,
            updated_by: expedicao.created_by
          })))
        }

        if (rotas.length > 0) {
          await trx('expedicoes_rotas').insert(rotas.map((cidadeId, ordem) => ({
            expedicao_id: id,
            cidade_id: cidadeId,
            ordem,
            created_by: expedicao.created_by,
            updated_by: expedicao.created_by
          })))
        }

        return await this.select(trx).where('expedicoes.id', id).first() as Row
      })

      return Either.right(toAttributes(created))
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to create expedição', cause: error }))
    }
  }
}
