import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { UserSessionNotFoundError } from './error/UserSessionNotFoundError'
import { type Attributes, UsuarioSessao } from './UsuarioSessao'
import { type UsuarioSessaoCollection } from './UsuarioSessaoCollection'

interface Dependencies {
  usuarioSessaoCollection: UsuarioSessaoCollection
  refreshToken: RefreshToken
  now?: () => Date
}

export class RotacionaUsuarioSessaoUseCase {
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection
  private readonly refreshToken: RefreshToken
  private readonly now: () => Date

  constructor(dependencies: Dependencies) {
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
    this.refreshToken = dependencies.refreshToken
    this.now = dependencies.now ?? (() => new Date())
  }

  async execute(params: { refreshToken: string }): Promise<Either<Error, { session: Attributes; refreshToken: string }>> {
    const hashed = this.refreshToken.hash(params.refreshToken)
    if (hashed.left()) {
      return hashed
    }

    const found = await this.usuarioSessaoCollection.findByRefreshTokenHash(hashed.value)
    if (found.left()) {
      return found
    }
    if (!found.value) {
      return Either.left(new UserSessionNotFoundError())
    }

    const now = this.now()
    const expired = await this.deleteIfExpired(found.value, now)
    if (expired.left()) {
      return expired
    }
    if (expired.value) {
      return Either.left(new UserSessionNotFoundError())
    }

    const generated = this.refreshToken.generate()
    if (generated.left()) {
      return generated
    }

    const updated = await this.usuarioSessaoCollection.updateRotation(found.value.id, {
      refreshTokenHash: generated.value.hash,
      lastUsedAt: now,
      expiresAt: UsuarioSessao.refreshExpiresAt(now)
    })
    if (updated.left()) {
      return updated
    }
    if (!updated.value) {
      return Either.left(new UserSessionNotFoundError())
    }

    return Either.right({
      session: updated.value,
      refreshToken: generated.value.token
    })
  }

  private async deleteIfExpired(session: Attributes, now: Date): Promise<Either<Error, boolean>> {
    if (!UsuarioSessao.expired(session.expiresAt, now)) {
      return Either.right(false)
    }

    const deleted = await this.usuarioSessaoCollection.deleteById(session.id)
    if (deleted.left()) {
      return deleted
    }

    return Either.right(true)
  }
}
