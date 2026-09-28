import { randomUUID } from 'node:crypto'

import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { type Attributes, UsuarioSessao } from './UsuarioSessao'
import { type UsuarioSessaoCollection } from './UsuarioSessaoCollection'

interface Dependencies {
  usuarioSessaoCollection: UsuarioSessaoCollection
  refreshToken: RefreshToken
  now?: () => Date
}

export class CriaUsuarioSessaoUseCase {
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection
  private readonly refreshToken: RefreshToken
  private readonly now: () => Date

  constructor(dependencies: Dependencies) {
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
    this.refreshToken = dependencies.refreshToken
    this.now = dependencies.now ?? (() => new Date())
  }

  async execute(params: { usuarioId: number }): Promise<Either<Error, { session: Attributes; refreshToken: string }>> {
    const generated = this.refreshToken.generate()
    if (generated.left()) {
      return generated
    }

    const createdAt = this.now()
    const attributes: Attributes = {
      id: randomUUID(),
      usuarioId: params.usuarioId,
      refreshTokenHash: generated.value.hash,
      createdAt,
      lastUsedAt: createdAt,
      expiresAt: UsuarioSessao.refreshExpiresAt(createdAt)
    }

    const session = UsuarioSessao.create(attributes)
    if (session.left()) {
      return session
    }

    const persisted = await this.usuarioSessaoCollection.create({
      id: session.value.id,
      usuarioId: session.value.usuarioId,
      refreshTokenHash: session.value.refreshTokenHash,
      createdAt: session.value.createdAt,
      lastUsedAt: session.value.lastUsedAt,
      expiresAt: session.value.expiresAt
    })
    if (persisted.left()) {
      return persisted
    }

    return Either.right({
      session: persisted.value,
      refreshToken: generated.value.token
    })
  }
}
