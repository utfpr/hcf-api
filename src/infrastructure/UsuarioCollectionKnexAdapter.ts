import { type Knex } from 'knex'

import {
  type Attributes, type AttributesComSenha, Usuario
} from '@/domain/usuario/Usuario'
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

  async findByEmail(email: string): Promise<Either<Error, AttributesComSenha | null>> {
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

      return this.toComSenha(row)
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to find usuário by email',
        cause: error
      }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
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

      return this.toAttributes(row)
    } catch (error) {
      return Either.left(new CollectionError({
        message: 'Failed to find usuário by id',
        cause: error
      }))
    }
  }

  private toAttributes(row: UsuarioRow): Either<Error, Attributes> {
    const created = Usuario.create({
      id: Number(row.id),
      nome: row.nome,
      email: row.email,
      tipoUsuarioId: Number(row.tipo_usuario_id)
    })
    if (created.left()) {
      return created
    }

    return Either.right({
      id: created.value.id,
      nome: created.value.nome,
      email: created.value.email,
      tipoUsuarioId: created.value.tipoUsuarioId
    })
  }

  private toComSenha(row: UsuarioRow): Either<Error, AttributesComSenha> {
    const created = Usuario.create({
      id: Number(row.id),
      nome: row.nome,
      email: row.email,
      tipoUsuarioId: Number(row.tipo_usuario_id),
      senha: row.senha as string
    })
    if (created.left()) {
      return created
    }

    return Either.right({
      id: created.value.id,
      nome: created.value.nome,
      email: created.value.email,
      tipoUsuarioId: created.value.tipoUsuarioId,
      senha: created.value.senha as string
    })
  }
}
