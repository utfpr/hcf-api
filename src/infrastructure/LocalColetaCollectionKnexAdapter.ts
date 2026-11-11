import { Knex } from 'knex'

import { LocalColetaDescricaoDuplicadaError } from '@/domain/localColeta/error/LocalColetaDescricaoDuplicadaError'
import { LocalColetaEmUsoError } from '@/domain/localColeta/error/LocalColetaEmUsoError'
import {
  LocalColeta, LocalColetaAttributes, LocalColetaRelation
} from '@/domain/localColeta/LocalColeta'
import {
  LocalColetaCollection, LocalColetaFilters
} from '@/domain/localColeta/LocalColetaCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'
interface Dependencies {
  knex: Knex
}

interface LocalColetaRow {
  id: number | string
  descricao: string | null
  cidade_id: number | string | null
  fase_sucessional_id: number | string | null
  cidade_nome: string | null
  estado_id: number | string | null
  estado_nome: string | null
  estado_sigla: string | null
  pais_id: number | string | null
  pais_nome: string | null
  pais_sigla: string | null
  fase_nome: string | null
}

export class LocalColetaCollectionKnexAdapter implements LocalColetaCollection {
  private readonly knex: Knex

  constructor({ knex }: Dependencies) {
    this.knex = knex
  }

  async create(attributes: LocalColetaAttributes): Promise<Either<Error, LocalColeta>> {
    const duplicate = await this.findDuplicate(attributes)
    if (duplicate.left()) return Either.left(duplicate.value)
    if (duplicate.value) return Either.left(new LocalColetaDescricaoDuplicadaError())

    try {
      const [row] = await this.knex('locais_coleta')
        .insert(attributes)
        .returning<{ id: number | string }[]>('id')

      const created = await this.findById(String(row.id))
      if (created.left()) return Either.left(created.value)
      if (!created.value) return Either.left(new CollectionError({ message: 'Created collection location could not be found' }))
      return Either.right(created.value)
    } catch (error) {
      if (isLocalColetaDuplicateError(error)) {
        return Either.left(new LocalColetaDescricaoDuplicadaError({ cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to create collection location', cause: error }))
    }
  }

  async updateById(id: string, attributes: LocalColetaAttributes): Promise<Either<Error, LocalColeta | undefined>> {
    const duplicate = await this.findDuplicate(attributes, id)
    if (duplicate.left()) return Either.left(duplicate.value)
    if (duplicate.value) return Either.left(new LocalColetaDescricaoDuplicadaError())

    try {
      const updated = await this.knex('locais_coleta')
        .where({ id })
        .update(attributes)
        .returning<{ id: number | string }[]>('id')

      if (!updated.length) return Either.right(undefined)

      const localColeta = await this.findById(id)
      if (localColeta.left()) return Either.left(localColeta.value)
      return Either.right(localColeta.value)
    } catch (error) {
      if (isLocalColetaDuplicateError(error)) {
        return Either.left(new LocalColetaDescricaoDuplicadaError({ cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to update collection location', cause: error }))
    }
  }

  async countTomboReferences(id: string): Promise<Either<Error, number>> {
    try {
      const row = await this.knex('tombos')
        .where({ local_coleta_id: id })
        .count<{ count: string | number }[]>({ count: '*' })
        .first()
      return Either.right(Number(row?.count ?? 0))
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to count collection location references', cause: error }))
    }
  }

  async deleteById(id: string): Promise<Either<Error, boolean>> {
    try {
      const deleted = await this.knex('locais_coleta').where({ id }).delete()
      return Either.right(deleted > 0)
    } catch (error) {
      if (isForeignKeyError(error)) {
        return Either.left(new LocalColetaEmUsoError({ cause: error }))
      }
      return Either.left(new CollectionError({ message: 'Failed to delete collection location', cause: error }))
    }
  }

  private async findDuplicate(attributes: LocalColetaAttributes, excludeId?: string): Promise<Either<Error, boolean>> {
    try {
      const query = this.knex('locais_coleta')
        .select('id')
        .where({ cidade_id: attributes.cidade_id })
        .whereRaw('LOWER(TRIM(descricao)) = LOWER(?)', [attributes.descricao])

      if (excludeId !== undefined) query.andWhereNot({ id: excludeId })
      return Either.right(Boolean(await query.first()))
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to check collection location description', cause: error }))
    }
  }

  async findAll(filters: LocalColetaFilters): Promise<Either<Error, { total: number; resultado: LocalColeta[] }>> {
    try {
      const query = this.query(filters)
      const [countRow] = await query.clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ count: string | number }[]>({ count: 'locais_coleta.id' })

      const total = Number(countRow?.count ?? 0)
      const order = filters.order ?? { column: 'id' as const, direction: 'desc' as const }
      const rowsQuery = order.column === 'id'
        ? query.orderBy('locais_coleta.id', order.direction)
        : query.orderByRaw(order.direction === 'asc'
            ? 'LOWER(locais_coleta.descricao) ASC'
            : 'LOWER(locais_coleta.descricao) DESC')

      if (!filters.getAll) {
        rowsQuery.limit(filters.limite).offset((filters.pagina - 1) * filters.limite)
      }

      const rows = await rowsQuery.select(this.columns()) as LocalColetaRow[]
      return Either.right({ total, resultado: rows.map(row => this.mapRow(row)) })
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list collection locations', cause: error }))
    }
  }

  async findById(id: string): Promise<Either<Error, LocalColeta | undefined>> {
    try {
      const row = await this.query({
        limite: 1,
        pagina: 1,
        getAll: true
      })
        .where('locais_coleta.id', id)
        .select(this.columns())
        .first() as LocalColetaRow | undefined

      return Either.right(row ? this.mapRow(row) : undefined)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find collection location', cause: error }))
    }
  }

  private query(filters: Partial<LocalColetaFilters>): Knex.QueryBuilder {
    const query = this.knex('locais_coleta')
      .leftJoin('cidades', 'cidades.id', 'locais_coleta.cidade_id')
      .leftJoin('estados', 'estados.id', 'cidades.estado_id')
      .leftJoin('paises', 'paises.id', 'estados.pais_id')
      .leftJoin('fase_sucessional', 'fase_sucessional.id', 'locais_coleta.fase_sucessional_id')

    if (filters.descricao) query.whereILike('locais_coleta.descricao', `%${filters.descricao}%`)

    if (filters.cidade_id) {
      query.where('locais_coleta.cidade_id', filters.cidade_id)
    } else if (filters.estado_id) {
      query.where('cidades.estado_id', filters.estado_id)
    } else if (filters.pais_id) {
      query.where('estados.pais_id', filters.pais_id)
    }

    return query
  }

  private columns(): string[] {
    return [
      'locais_coleta.id',
      'locais_coleta.descricao',
      'locais_coleta.cidade_id',
      'locais_coleta.fase_sucessional_id',
      'cidades.nome as cidade_nome',
      'estados.id as estado_id',
      'estados.nome as estado_nome',
      'estados.sigla as estado_sigla',
      'paises.id as pais_id',
      'paises.nome as pais_nome',
      'paises.sigla as pais_sigla',
      'fase_sucessional.nome as fase_nome'
    ]
  }

  private mapRow(row: LocalColetaRow): LocalColeta {
    let pais: LocalColetaRelation | null = null
    if (row.pais_id !== null) {
      pais = {
        id: row.pais_id,
        nome: row.pais_nome ?? '',
        sigla: row.pais_sigla
      }
    }

    let estado: LocalColetaRelation | null = null
    if (row.estado_id !== null) {
      estado = {
        id: row.estado_id,
        nome: row.estado_nome ?? '',
        sigla: row.estado_sigla,
        pais
      }
    }

    const cidade = row.cidade_id !== null
      ? {
          id: row.cidade_id,
          nome: row.cidade_nome ?? '',
          estado
        }
      : null

    const faseSucessional = row.fase_sucessional_id !== null
      ? { id: row.fase_sucessional_id, nome: row.fase_nome ?? '' }
      : null

    return {
      id: row.id,
      descricao: row.descricao,
      cidade_id: row.cidade_id,
      fase_sucessional_id: row.fase_sucessional_id,
      cidade,
      fase_sucessional: faseSucessional
    }
  }
}

function isLocalColetaDuplicateError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const databaseError = error as { code?: string; constraint?: string }
  return databaseError.code === '23505' && databaseError.constraint === 'uniq_locais_coleta_cidade_descricao'
}

function isForeignKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === '23503')
}
