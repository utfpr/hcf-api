import { Knex } from 'knex'

import { type UsuarioCollection, type UsuarioRecord } from '@/domain/auth/UsuarioCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

interface Row {
  id: number
  nome: string
  email: string
  tipo_usuario_id: number
  senha: string
}

const COLUMNS: Array<keyof Row> = [
  'id',
  'nome',
  'email',
  'tipo_usuario_id',
  'senha'
]

const TABLE = 'usuarios'

export class UsuarioCollectionKnexAdapter implements UsuarioCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findByEmail(email: string): Promise<Either<Error, UsuarioRecord | null>> {
    try {
      const row = await this.knex<Row>(TABLE)
        .select(COLUMNS)
        .where({ email })
        .first()

      return Either.right(row ? toRecord(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to find usuário by email',
        cause: error
      }))
    }
  }

  async findById(id: number): Promise<Either<Error, UsuarioRecord | null>> {
    try {
      const row = await this.knex<Row>(TABLE)
        .select(COLUMNS)
        .where({ id })
        .first()

      return Either.right(row ? toRecord(row) : null)
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to find usuário by id',
        cause: error
      }))
    }
  }
}

function toRecord(row: Row): UsuarioRecord {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    tipoUsuarioId: row.tipo_usuario_id,
    senhaHash: row.senha
  }
}
