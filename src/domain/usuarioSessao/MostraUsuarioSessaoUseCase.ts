import { type Attributes as UsuarioAttributes } from '@/domain/usuario/Usuario'
import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { type AccessToken } from '@/library/auth/AccessToken'
import { Either } from '@/library/either/Either'

import { UserSessionNotFoundError } from './error/UserSessionNotFoundError'
import { type Attributes, UsuarioSessao } from './UsuarioSessao'
import { type UsuarioSessaoCollection } from './UsuarioSessaoCollection'

interface Dependencies {
  accessToken: AccessToken
  usuarioCollection: UsuarioCollection
  usuarioSessaoCollection: UsuarioSessaoCollection
  now?: () => Date
}

export class MostraUsuarioSessaoUseCase {
  private readonly accessToken: AccessToken
  private readonly usuarioCollection: UsuarioCollection
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection
  private readonly now: () => Date

  constructor(dependencies: Dependencies) {
    this.accessToken = dependencies.accessToken
    this.usuarioCollection = dependencies.usuarioCollection
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
    this.now = dependencies.now ?? (() => new Date())
  }

  async execute(params: { accessToken: string }): Promise<Either<Error, UsuarioAttributes>> {
    const verified = this.accessToken.verify(params.accessToken)
    if (verified.left()) {
      return Either.left(new UserSessionNotFoundError({ cause: verified.value }))
    }

    const found = await this.usuarioSessaoCollection.findById(verified.value.sid)
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

    const usuario = await this.usuarioCollection.findById(verified.value.sub)
    if (usuario.left()) {
      return usuario
    }
    if (!usuario.value) {
      return Either.left(new UserSessionNotFoundError())
    }

    return Either.right(usuario.value.toAttributes())
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
