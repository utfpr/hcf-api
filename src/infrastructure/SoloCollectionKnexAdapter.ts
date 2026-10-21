import { Knex } from 'knex'

import { SoloEmUsoError } from '@/domain/solo/error/SoloEmUsoError'
import { SoloNomeDuplicadoError } from '@/domain/solo/error/SoloNomeDuplicadoError'
import { Attributes } from '@/domain/solo/Solo'
import { SoloCollection, SoloFilters } from '@/domain/solo/SoloCollection'
import { Either } from '@/library/either/Either'

import { CollectionError } from './error/CollectionError'

function isDuplicateSoloError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : ''
  const detail = typeof error === 'object' && error !== null && 'detail' in error
    ? String((error as { detail?: unknown }).detail)
    : ''
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: unknown }).message)
    : ''
  const constraint = typeof error === 'object' && error !== null && 'constraint' in error
    ? String((error as { constraint?: unknown }).constraint)
    : ''

  return code === '23505'
    || /duplicate key|already exists|unique constraint/i.test(`${detail} ${message} ${constraint}`)
    || (/nome/i.test(constraint) && /solo/i.test(constraint))
}

function isSoloInUseError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : ''
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: unknown }).message)
    : ''
  const constraint = typeof error === 'object' && error !== null && 'constraint' in error
    ? String((error as { constraint?: unknown }).constraint)
    : ''

  return code === '23503'
    || code === 'ER_ROW_IS_REFERENCED_2'
    || /foreign key|still referenced|cannot delete or update a parent row|violates foreign key constraint/i.test(`${message} ${constraint}`)
    || /solo/i.test(constraint)
}

interface Dependencies {
  knex: Knex
}

export class SoloCollectionKnexAdapter implements SoloCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: SoloFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex<Attributes>('solos')
        .select(['id', 'nome'])

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      const order = filters.order ?? { column: 'id', direction: 'desc' }
      query.orderBy(order.column, order.direction)

      return Either.right(await query)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to list solos', cause: error }))
    }
  }

  async findById(id: number): Promise<Either<Error, Attributes | null>> {
    try {
      const solo = await this.knex<Attributes>('solos').select(['id', 'nome']).where({ id }).first()
      return Either.right(solo ?? null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find solo', cause: error }))
    }
  }

  async findByNome(nome: string): Promise<Either<Error, Attributes | null>> {
    try {
      const solo = await this.knex<Attributes>('solos')
        .select(['id', 'nome'])
        .whereRaw('LOWER(nome) = LOWER(?)', [nome.trim()])
        .first()

      return Either.right(solo ?? null)
    } catch (error) {
      return Either.left(new CollectionError({ message: 'Failed to find solo by name', cause: error }))
    }
  }

  async create(data: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes>> {
    try {
      const [solo] = await this.knex<Attributes>('solos')
        .insert({ nome: data.nome.trim() })
        .returning(['id', 'nome']) as Attributes[]

      return Either.right(solo)
    } catch (error) {
      if (isDuplicateSoloError(error)) {
        return Either.left(new SoloNomeDuplicadoError({ cause: error }))
      }

      return Either.left(new CollectionError({ message: 'Erro ao criar solo', cause: error }))
    }
  }

  async update(id: number, data: Pick<Attributes, 'nome'>): Promise<Either<Error, Attributes | null>> {
    try {
      const [solo] = await this.knex<Attributes>('solos')
        .where({ id })
        .update({ nome: data.nome.trim() })
        .returning(['id', 'nome']) as Attributes[]

      return Either.right(solo ?? null)
    } catch (error) {
      if (isDuplicateSoloError(error)) {
        return Either.left(new SoloNomeDuplicadoError({ cause: error }))
      }

      return Either.left(new CollectionError({ message: 'Erro ao atualizar solo', cause: error }))
    }
  }

  async delete(id: number): Promise<Either<Error, boolean>> {
    try {
      const deleted = await this.knex<Attributes>('solos').where({ id }).delete()
      return Either.right(deleted > 0)
    } catch (error) {
      if (isSoloInUseError(error)) {
        return Either.left(new SoloEmUsoError({ cause: error }))
      }

      return Either.left(new CollectionError({ message: 'Erro ao remover solo', cause: error }))
    }
  }
}
