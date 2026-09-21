import { Knex } from 'knex'

import { Attributes, CreateAttributes } from '@/domain/expedicao/Expedicao'
import { ExpedicaoCollection, ExpedicaoFilters, Paginated } from '@/domain/expedicao/ExpedicaoCollection'
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

  async findAll(filters: ExpedicaoFilters): Promise<Either<Error, Paginated<Attributes>>> {
    try {
      const query = this.select()

      if (filters.cidade_id) query.where('expedicoes.cidade_id', filters.cidade_id)

      if (filters.usuario_id) {
        query.whereIn('expedicoes.id', this.knex('expedicoes_participantes')
          .select('expedicao_id')
          .where('usuario_id', filters.usuario_id))
      }

      if (filters.data_inicio_de) query.where('expedicoes.data_inicio', '>=', filters.data_inicio_de)
      if (filters.data_fim_ate) query.where('expedicoes.data_fim', '<=', filters.data_fim_ate)

      // contagem de total de registros
      const countQuery = query.clone()
      const [{ count }] = await countQuery.clearSelect().count('* as count')
      const total = Number(count)

      // valores padrão da paginação(20 e 1)
      const limite = filters.limite && filters.limite > 0 ? filters.limite : 20
      const pagina = filters.pagina && filters.pagina > 0 ? filters.pagina : 1
      const offset = (pagina - 1) * limite

      query.limit(limite).offset(offset)

      // ordenação
      const order = filters.order ?? { column: 'id' as const, direction: 'desc' as const }
      query.orderBy(`expedicoes.${order.column}`, order.direction)

      const rows = await query as Row[]

      // página vazia, já retorna
      if (rows.length === 0) {
        return Either.right({ itens: [], total, limite, pagina })
      }

      const expedicoesIds = rows.map(row => row.id)

      const [participantesRows, rotasRows] = await Promise.all([
        this.knex('expedicoes_participantes')
          .select('expedicao_id', 'usuario_id')
          .whereIn('expedicao_id', expedicoesIds),
        
        this.knex('expedicoes_rotas')
          .select('expedicao_id', 'cidade_id')
          .whereIn('expedicao_id', expedicoesIds)
          .orderBy('ordem', 'asc')
      ])

      const itens = rows.map(row => {
        return {
          ...toAttributes(row),
          participantes: participantesRows
             .filter(p => p.expedicao_id === row.id)
             .map(p => p.usuario_id),
          rotas: rotasRows
             .filter(r => r.expedicao_id === row.id)
             .map(r => r.cidade_id)
        }
      })
      
      return Either.right({
        itens,
        total,
        limite,
        pagina
      })
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list expedições', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const row = await this.select().where('expedicoes.id', id).first() as Row | undefined
      
      if (!row) {
        return Either.right(null)
      }

      const participantes = await this.knex('expedicoes_participantes')
        .join('usuarios', 'usuarios.id', 'expedicoes_participantes.usuario_id')
        .where('expedicoes_participantes.expedicao_id', id)
        .select('usuarios.id', 'usuarios.nome', 'usuarios.email')

      const rotas = await this.knex('expedicoes_rotas')
        .join('cidades', 'cidades.id', 'expedicoes_rotas.cidade_id')
        .where('expedicoes_rotas.expedicao_id', id)
        .select(
          'cidades.id as cidade_id', 
          'expedicoes_rotas.ordem', 
          'cidades.nome as nome_cidade', 
          'cidades.estado_id'
        )
        .orderBy('expedicoes_rotas.ordem', 'asc')

      return Either.right({
        ...toAttributes(row),
        participantes,
        rotas
      } as unknown as Attributes)
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

  async delete(id: number): Promise<Either<Error, void>> {
    try {
      await this.knex.transaction(async trx => {
        await trx('expedicoes_participantes').where('expedicao_id', id).delete()
        await trx('expedicoes_rotas').where('expedicao_id', id).delete()
        await trx('expedicoes').where('id', id).delete()
      })

      return Either.right(undefined)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to delete expedição', cause: error }))
    }
  }
}
