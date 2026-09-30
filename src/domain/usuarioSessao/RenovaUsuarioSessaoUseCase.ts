import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { type AccessToken } from '@/library/auth/AccessToken'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { UserSessionNotFoundError } from './error/UserSessionNotFoundError'
import { type SessaoAutenticada } from './sessaoAutenticada'
import { type Attributes, UsuarioSessao } from './UsuarioSessao'
import { type UsuarioSessaoCollection } from './UsuarioSessaoCollection'

interface Dependencies {
  usuarioCollection: UsuarioCollection
  usuarioSessaoCollection: UsuarioSessaoCollection
  refreshToken: RefreshToken
  accessToken: AccessToken
  now?: () => Date
}

export class RenovaUsuarioSessaoUseCase {
  private readonly usuarioCollection: UsuarioCollection
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection
  private readonly refreshToken: RefreshToken
  private readonly accessToken: AccessToken
  private readonly now: () => Date

  constructor(dependencies: Dependencies) {
    this.usuarioCollection = dependencies.usuarioCollection
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
    this.refreshToken = dependencies.refreshToken
    this.accessToken = dependencies.accessToken
    this.now = dependencies.now ?? (() => new Date())
  }

  async execute(params: { refreshToken: string }): Promise<Either<Error, SessaoAutenticada>> {
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

    const expired = await this.deleteIfExpired(found.value)
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

    const now = this.now()
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

    const usuario = await this.usuarioCollection.findById(updated.value.usuarioId)
    if (usuario.left()) {
      return usuario
    }
    if (!usuario.value) {
      await this.usuarioSessaoCollection.deleteById(updated.value.id)
      return Either.left(new UserSessionNotFoundError())
    }

    const signed = this.accessToken.sign({
      sub: usuario.value.id,
      sid: updated.value.id
    })
    if (signed.left()) {
      return signed
    }

    return Either.right({
      accessToken: signed.value,
      refreshToken: generated.value.token,
      user: usuario.value.toAttributes()
    })
  }

  private async deleteIfExpired(session: Attributes): Promise<Either<Error, boolean>> {
    if (!UsuarioSessao.expired(session.expiresAt, this.now())) {
      return Either.right(false)
    }

    const deleted = await this.usuarioSessaoCollection.deleteById(session.id)
    if (deleted.left()) {
      return deleted
    }

    return Either.right(true)
  }
}
