import { Knex } from 'knex'

import {
  Attributes, CreateAttributes, RotaInput, UpdateAttributes
} from '@/domain/expedicao/Expedicao'
import {
  ExpedicaoCollection, ExpedicaoFilters, ExpedicaoListItem, ParticipanteExpedicao, Paginated
} from '@/domain/expedicao/ExpedicaoCollection'
import { DuplicateParticipantError } from '@/infrastructure/error/DuplicateParticipantError'
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

interface ListRow extends Row {
  cidade_nome: string | null
  estado_sigla: string | null
}

interface ParticipanteRow {
  expedicao_id: number
  usuario_id: number
  nome: string
}
interface RotaBancoRow {
  rota_id: number
  cidade_id: number
  ordem: number
  nome_cidade: string
  estado_id: string
}

interface LocalBancoRow {
  expedicao_rota_id: number
  id: string | number
  descricao: string | null
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

  // --- FUNÇÃO PARA VALIDAÇÃO GEOGRÁFICA ---
  private async validaLocaisColeta(trx: Knex.Transaction, rotas: RotaInput[]): Promise<void> {
    const todosLocaisIds = rotas.flatMap(r => r.locais_coleta_ids)
    if (todosLocaisIds.length === 0) return

    // Cria um tipo para a resposta do banco
    type LocalColetaRow = { id: string | number; cidade_id: string | number | null }

    const locaisBanco = await trx('locais_coleta')
      .whereIn('id', todosLocaisIds)
      .select('id', 'cidade_id') as LocalColetaRow[]

    // Valida cada local de coleta para garantir que ele existe e pertence à cidade correta
    for (const rota of rotas) {
      for (const localId of rota.locais_coleta_ids) {
        const local = locaisBanco.find((l: LocalColetaRow) => Number(l.id) === localId)

        if (!local) {
          throw new Error(`Local de coleta com ID ${localId} não existe.`)
        }
        if (!local.cidade_id || Number(local.cidade_id) !== rota.cidade_id) {
          throw new Error(`Local de coleta com ID ${localId} pertence a outra cidade (ou a cidade é nula) e não pode ser adicionado à rota da cidade ${rota.cidade_id}.`)
        }
      }
    }
  }

  async findAll(filters: ExpedicaoFilters): Promise<Either<Error, Paginated<ExpedicaoListItem>>> {
    try {
      // nome da cidade e sigla da UF vêm junto para o cliente não precisar de uma requisição por cidade
      const query = this.select()
        .leftJoin('cidades', 'cidades.id', 'expedicoes.cidade_id')
        .leftJoin('estados', 'estados.id', 'cidades.estado_id')
        .select([
          'cidades.nome as cidade_nome',
          // estados.sigla é char(4): remove o preenchimento com espaços
          this.knex.raw('trim(estados.sigla) as estado_sigla')
        ])

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
      const [result] = await countQuery.clearSelect().count<{ count: string | number }[]>('* as count')
      const count = result?.count ?? 0
      const total = Number(count)

      // valores padrão da paginação(20 e 1)
      const limite = filters.limite && filters.limite > 0 ? filters.limite : 20
      const pagina = filters.pagina && filters.pagina > 0 ? filters.pagina : 1
      const offset = (pagina - 1) * limite

      query.limit(limite).offset(offset)

      // ordenação
      const order = filters.order ?? { column: 'id' as const, direction: 'desc' as const }
      query.orderBy(`expedicoes.${order.column}`, order.direction)

      const rows = await query as ListRow[]

      // página vazia, já retorna
      if (rows.length === 0) {
        return Either.right({
          itens: [], total, limite, pagina
        })
      }

      const expedicoesIds = rows.map(row => row.id)

      const [participantesRows, rotasRows] = await Promise.all([
        this.knex('expedicoes_participantes')
          .join('usuarios', 'usuarios.id', 'expedicoes_participantes.usuario_id')
          .select('expedicoes_participantes.expedicao_id', 'expedicoes_participantes.usuario_id', 'usuarios.nome')
          .whereIn('expedicoes_participantes.expedicao_id', expedicoesIds) as Promise<ParticipanteRow[]>,

        this.knex<{ expedicao_id: number; cidade_id: number }>('expedicoes_rotas')
          .select('expedicao_id', 'cidade_id')
          .whereIn('expedicao_id', expedicoesIds)
          .orderBy('ordem', 'asc')
      ])

      const itens = rows.map(row => {
        return {
          ...toAttributes(row),
          cidade_nome: row.cidade_nome,
          estado_sigla: row.estado_sigla,
          participantes: participantesRows
            .filter(p => p.expedicao_id === row.id)
            .map((p): ParticipanteExpedicao => ({ id: p.usuario_id, nome: p.nome })),
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

      // Busca as rotas
      const rotasBanco = await this.knex('expedicoes_rotas')
        .join('cidades', 'cidades.id', 'expedicoes_rotas.cidade_id')
        .where('expedicoes_rotas.expedicao_id', id)
        .select(
          'expedicoes_rotas.id as rota_id',
          'cidades.id as cidade_id',
          'expedicoes_rotas.ordem',
          'cidades.nome as nome_cidade',
          'cidades.estado_id'
        )
        .orderBy('expedicoes_rotas.ordem', 'asc') as RotaBancoRow[]

      // Busca os locais de coleta de todas as rotas dessa expedição de uma vez
      const rotasIds = rotasBanco.map((r: RotaBancoRow) => r.rota_id)
      const locaisBanco = rotasIds.length > 0
        ? await this.knex('expedicoes_rotas_locais_coleta')
          .join('locais_coleta', 'locais_coleta.id', 'expedicoes_rotas_locais_coleta.local_coleta_id')
          .whereIn('expedicoes_rotas_locais_coleta.expedicao_rota_id', rotasIds)
          .select(
            'expedicoes_rotas_locais_coleta.expedicao_rota_id',
            'locais_coleta.id',
            'locais_coleta.descricao'
          ) as LocalBancoRow[]
        : []

      // Monta a árvore aninhada na memória
      const rotas = rotasBanco.map((rota: RotaBancoRow) => ({
        cidade_id: rota.cidade_id,
        ordem: rota.ordem,
        nome_cidade: rota.nome_cidade,
        estado: rota.estado_id,
        locais_coleta: locaisBanco
          .filter((l: LocalBancoRow) => l.expedicao_rota_id === rota.rota_id)
          .map((l: LocalBancoRow) => ({ id: Number(l.id), descricao: l.descricao }))
      }))

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
        // Valida locais de coleta antes de inserir
        await this.validaLocaisColeta(trx, rotas)

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
          for (let i = 0; i < rotas.length; i++) {
            const rota = rotas[i]
            // Insere a rota e pega o ID gerado para vincular os locais
            const [{ rota_id }] = await trx('expedicoes_rotas')
              .insert({
                expedicao_id: id,
                cidade_id: rota.cidade_id,
                ordem: i,
                created_by: expedicao.created_by,
                updated_by: expedicao.created_by
              })
              .returning<{ rota_id: number }[]>(['id as rota_id'])

            // Se essa rota tiver locais, insere na tabela pivot
            if (rota.locais_coleta_ids.length > 0) {
              await trx('expedicoes_rotas_locais_coleta').insert(
                rota.locais_coleta_ids.map(localId => ({
                  expedicao_rota_id: rota_id,
                  local_coleta_id: localId
                }))
              )
            }
          }
        }

        return await this.select(trx).where('expedicoes.id', id).first() as Row
      })

      return Either.right(toAttributes(created))
    } catch (error) {
      if (error instanceof Error && error.message.includes('pertence a outra cidade')) {
        return Either.left(new Error(error.message)) // Erro de negócio (400)
      }
      return Either.left(new CollectionError({ message: 'Failed to create expedição', cause: error }))
    }
  }

  async delete(id: number): Promise<Either<Error, void>> {
    try {
      const affectedRows = await this.knex.transaction(async trx => {
        // Deleta as tabelas filhas primeiro
        await trx('expedicoes_participantes').where('expedicao_id', id).delete()
        await trx('expedicoes_rotas').where('expedicao_id', id).delete()

        // Deleta a expedição e converte a tipagem do resultado explicitamente para number
        const count = await trx('expedicoes').where('id', id).delete()
        return count
      })

      // Se apagou 0 linhas, é porque o ID não existia
      if (affectedRows === 0) {
        return Either.left(new Error('Expedição não encontrada'))
      }

      return Either.right(undefined)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to delete expedição', cause: error }))
    }
  }

  async update(id: number, attributes: UpdateAttributes): Promise<Either<Error, Attributes>> {
    try {
      await this.knex('expedicoes')
        .where({ id })
        .update({ ...attributes, updated_at: this.knex.fn.now() })

      const row = await this.select().where('expedicoes.id', id).first() as Row | undefined

      if (!row) return Either.left(new Error('Expedição não encontrada'))

      return Either.right(toAttributes(row))
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to update expedição', cause: error }))
    }
  }

  async addParticipant(expedicaoId: number, usuarioId: number): Promise<Either<Error, void>> {
    try {
      await this.knex('expedicoes_participantes').insert({
        expedicao_id: expedicaoId,
        usuario_id: usuarioId
      })
      return Either.right(undefined)
    } catch (error: unknown) {
      const dbError = error as { code?: string }

      if (dbError.code === '23505') {
        return Either.left(new DuplicateParticipantError({
          message: 'O usuário já está nesta expedição',
          cause: dbError
        }))
      }
      return Either.left(new CollectionError({ message: 'Falha ao adicionar participante', cause: error }))
    }
  }

  async removeParticipant(expedicaoId: number, usuarioId: number): Promise<Either<Error, void>> {
    try {
      await this.knex('expedicoes_participantes')
        .where({ expedicao_id: expedicaoId, usuario_id: usuarioId })
        .delete()
      return Either.right(undefined)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Falha ao remover participante', cause: error }))
    }
  }

  async substituteRoute(expedicaoId: number, rotas: RotaInput[]): Promise<Either<Error, void>> {
    try {
      await this.knex.transaction(async trx => {
        // Valida locais de coleta
        await this.validaLocaisColeta(trx, rotas)

        // usa uma transaction para garantir que a exclusão e a inserção ocorram sem a perda de dados em caso de falha.
        // se qualquer operação falhar, a transação será revertida e nenhuma alteração será feita no banco de dados.
        // devido a constraint unique, estamos deletando todas as rotas da expedição e inserindo novamente,
        // já na ordem correta e seguindo a constraint.
        // o ON DELETE CASCADE da tabela nova apagará os vínculos de locais de coleta automaticamente
        await trx('expedicoes_rotas').where('expedicao_id', expedicaoId).delete()

        // Insere as novas rotas e os seus locais
        if (rotas.length > 0) {
          for (let i = 0; i < rotas.length; i++) {
            const rota = rotas[i]

            const [{ rota_id }] = await trx('expedicoes_rotas')
              .insert({
                expedicao_id: expedicaoId,
                cidade_id: rota.cidade_id,
                ordem: i
              })
              .returning<{ rota_id: number }[]>(['id as rota_id'])

            if (rota.locais_coleta_ids.length > 0) {
              await trx('expedicoes_rotas_locais_coleta').insert(
                rota.locais_coleta_ids.map(localId => ({
                  expedicao_rota_id: rota_id,
                  local_coleta_id: localId
                }))
              )
            }
          }
        }
      })
      return Either.right(undefined)
    } catch (error) {
      if (error instanceof Error && error.message.includes('pertence a outra cidade')) {
        return Either.left(new Error(error.message)) // Erro de negócio (400)
      }
      return Either.left(new CollectionError({ message: 'Falha ao substituir rotas', cause: error }))
    }
  }
}
