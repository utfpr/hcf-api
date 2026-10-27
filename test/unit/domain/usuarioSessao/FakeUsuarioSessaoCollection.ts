import { type Attributes, UsuarioSessao } from '@/domain/usuarioSessao/UsuarioSessao'
import {
  type RotationUpdate,
  type UsuarioSessaoCollection
} from '@/domain/usuarioSessao/UsuarioSessaoCollection'
import { Either } from '@/library/either/Either'

export class FakeUsuarioSessaoCollection implements UsuarioSessaoCollection {
  readonly rows = new Map<string, Attributes>()

  create(attributes: Attributes): Promise<Either<Error, Attributes>> {
    const stored = { ...attributes }
    this.rows.set(stored.id, stored)
    return Promise.resolve(Either.right({ ...stored }))
  }

  findById(id: string): Promise<Either<Error, Attributes | null>> {
    const row = this.rows.get(id)
    return Promise.resolve(Either.right(row ? { ...row } : null))
  }

  findByRefreshTokenHash(hash: string): Promise<Either<Error, Attributes | null>> {
    const row = [...this.rows.values()].find(session => session.refreshTokenHash === hash)
    return Promise.resolve(Either.right(row ? { ...row } : null))
  }

  updateRotation(id: string, update: RotationUpdate): Promise<Either<Error, Attributes | null>> {
    const current = this.rows.get(id)
    if (!current) {
      return Promise.resolve(Either.right(null))
    }

    const next: Attributes = {
      ...current,
      refreshTokenHash: update.refreshTokenHash,
      lastUsedAt: update.lastUsedAt,
      expiresAt: update.expiresAt
    }
    this.rows.set(id, next)
    return Promise.resolve(Either.right({ ...next }))
  }

  deleteById(id: string): Promise<Either<Error, void>> {
    this.rows.delete(id)
    return Promise.resolve(Either.right(undefined))
  }

  deleteByUsuarioId(usuarioId: number): Promise<Either<Error, void>> {
    for (const [id, session] of this.rows) {
      if (session.usuarioId === usuarioId) {
        this.rows.delete(id)
      }
    }
    return Promise.resolve(Either.right(undefined))
  }
}

export function makeSession(overrides?: Partial<Attributes>): Attributes {
  const createdAt = overrides?.createdAt ?? new Date('2026-01-01T00:00:00.000Z')
  return {
    id: '11111111-1111-4111-8111-111111111111',
    usuarioId: 10,
    refreshTokenHash: 'a'.repeat(64),
    createdAt,
    lastUsedAt: createdAt,
    expiresAt: UsuarioSessao.refreshExpiresAt(createdAt),
    ...overrides
  }
}
