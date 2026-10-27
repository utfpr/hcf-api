import { Knex } from 'knex'

import { type Attributes } from '@/domain/usuarioSessao/UsuarioSessao'
import {
  type RotationUpdate,
  type UsuarioSessaoCollection
} from '@/domain/usuarioSessao/UsuarioSessaoCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

interface Row {
  id: string
  usuario_id: number
  refresh_token_hash: string
  created_at: Date
  last_used_at: Date
  expires_at: Date
}

const COLUMNS: Array<keyof Row> = [
  'id',
  'usuario_id',
  'refresh_token_hash',
  'created_at',
  'last_used_at',
  'expires_at'
]

const TABLE = 'usuarios_sessoes'

export class UsuarioSessaoCollectionKnexAdapter implements UsuarioSessaoCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async create(attributes: Attributes): Promise<Either<Error, Attributes>> {
    try {
      const rows = await this.knex<Row>(TABLE)
        .insert({
          id: attributes.id,
          usuario_id: attributes.usuarioId,
          refresh_token_hash: attributes.refreshTokenHash,
          created_at: attributes.createdAt,
          last_used_at: attributes.lastUsedAt,
          expires_at: attributes.expiresAt
        })
        .returning(COLUMNS)

      const row = rows[0]
      if (!row) {
        return Either.left(new CollectionError({ message: 'Failed to create usuário sessão' }))
      }

      return Either.right(toAttributes(row))
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to create usuário sessão',
        cause: error
      }))
    }
  }

  async findById(id: string): Promise<Either<Error, Attributes | null>> {
    try {
      const row = await this.knex<Row>(TABLE)
        .select(COLUMNS)
        .where({ id })
        .first()

      return Either.right(row ? toAttributes(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to find usuário sessão by id',
        cause: error
      }))
    }
  }

  async findByRefreshTokenHash(hash: string): Promise<Either<Error, Attributes | null>> {
    try {
      const row = await this.knex<Row>(TABLE)
        .select(COLUMNS)
        .where({ refresh_token_hash: hash })
        .first()

      return Either.right(row ? toAttributes(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to find usuário sessão by refresh token hash',
        cause: error
      }))
    }
  }

  async updateRotation(id: string, update: RotationUpdate): Promise<Either<Error, Attributes | null>> {
    try {
      const rows = await this.knex<Row>(TABLE)
        .where({ id })
        .update({
          refresh_token_hash: update.refreshTokenHash,
          last_used_at: update.lastUsedAt,
          expires_at: update.expiresAt
        })
        .returning(COLUMNS)

      const row = rows[0]
      return Either.right(row ? toAttributes(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to rotate usuário sessão',
        cause: error
      }))
    }
  }

  async deleteById(id: string): Promise<Either<Error, void>> {
    try {
      await this.knex<Row>(TABLE).where({ id }).delete()
      return Either.right(undefined)
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to delete usuário sessão',
        cause: error
      }))
    }
  }

  async deleteByUsuarioId(usuarioId: number): Promise<Either<Error, void>> {
    try {
      await this.knex<Row>(TABLE).where({ usuario_id: usuarioId }).delete()
      return Either.right(undefined)
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to delete usuário sessões',
        cause: error
      }))
    }
  }
}

function toAttributes(row: Row): Attributes {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    refreshTokenHash: row.refresh_token_hash,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at
  }
}
