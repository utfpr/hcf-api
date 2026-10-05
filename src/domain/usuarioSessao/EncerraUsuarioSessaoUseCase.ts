import { type AccessToken } from '@/library/auth/AccessToken'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { UserSessionNotFoundError } from './error/UserSessionNotFoundError'
import { type Attributes, UsuarioSessao } from './UsuarioSessao'
import { type UsuarioSessaoCollection } from './UsuarioSessaoCollection'

interface Dependencies {
  usuarioSessaoCollection: UsuarioSessaoCollection
  refreshToken: RefreshToken
  accessToken: AccessToken
  now?: () => Date
}

export class EncerraUsuarioSessaoUseCase {
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection
  private readonly refreshToken: RefreshToken
  private readonly accessToken: AccessToken
  private readonly now: () => Date

  constructor(dependencies: Dependencies) {
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
    this.refreshToken = dependencies.refreshToken
    this.accessToken = dependencies.accessToken
    this.now = dependencies.now ?? (() => new Date())
  }

  async execute(params: {
    refreshToken?: string
    accessToken?: string
    all?: boolean
  }): Promise<Either<Error, void>> {
    if (params.all) {
      return this.deleteAll(params.accessToken)
    }

    if (params.refreshToken) {
      return this.deleteByRefreshToken(params.refreshToken)
    }

    if (params.accessToken) {
      return this.deleteByAccessToken(params.accessToken)
    }

    return Either.left(new UserSessionNotFoundError())
  }

  private async deleteAll(accessToken: string | undefined): Promise<Either<Error, void>> {
    if (!accessToken) {
      return Either.left(new UserSessionNotFoundError())
    }

    const verified = this.accessToken.verify(accessToken)
    if (verified.left()) {
      return Either.left(new UserSessionNotFoundError({ cause: verified.value }))
    }

    return this.usuarioSessaoCollection.deleteByUsuarioId(verified.value.sub)
  }

  private async deleteByRefreshToken(refreshToken: string): Promise<Either<Error, void>> {
    const hashed = this.refreshToken.hash(refreshToken)
    if (hashed.left()) {
      return Either.left(new UserSessionNotFoundError({ cause: hashed.value }))
    }

    const found = await this.usuarioSessaoCollection.findByRefreshTokenHash(hashed.value)
    if (found.left()) {
      return found
    }
    if (!found.value) {
      return Either.right(undefined)
    }

    const expired = await this.deleteIfExpired(found.value)
    if (expired.left()) {
      return expired
    }
    if (expired.value) {
      return Either.right(undefined)
    }

    return this.usuarioSessaoCollection.deleteById(found.value.id)
  }

  private async deleteByAccessToken(accessToken: string): Promise<Either<Error, void>> {
    const verified = this.accessToken.verify(accessToken)
    if (verified.left()) {
      return Either.left(new UserSessionNotFoundError({ cause: verified.value }))
    }

    return this.usuarioSessaoCollection.deleteById(verified.value.sid)
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
