import { type Knex } from 'knex'

import { Usuario } from '@/domain/usuario/Usuario'
import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

interface UsuarioRow {
  id: number | string
  nome: string
  email: string
  senha?: string
  tipo_usuario_id: number | string
}

export class UsuarioCollectionKnexAdapter implements UsuarioCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findByEmail(email: string): Promise<Either<Error, Usuario | null>> {
    try {
      const row = await this.knex<UsuarioRow>('usuarios')
        .select([
          'id',
          'nome',
          'email',
          'senha',
          'tipo_usuario_id'
        ])
        .where({ email })
        .first()

      if (!row || row.senha === undefined) {
        return Either.right(null)
      }

      return Usuario.create({
        id: Number(row.id),
        nome: row.nome,
        email: row.email,
        tipoUsuarioId: Number(row.tipo_usuario_id),
        senha: row.senha
      })
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to find usuário by email',
        cause: error
      }))
    }
  }

  async findById(id: number): Promise<Either<Error, Usuario | null>> {
    try {
      const row = await this.knex<UsuarioRow>('usuarios')
        .select([
          'id',
          'nome',
          'email',
          'tipo_usuario_id'
        ])
        .where({ id })
        .first()

      if (!row) {
        return Either.right(null)
      }

      return Usuario.create({
        id: Number(row.id),
        nome: row.nome,
        email: row.email,
        tipoUsuarioId: Number(row.tipo_usuario_id)
      })
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to find usuário by id',
        cause: error
      }))
    }
  }
}
