import { Either } from '@/library/either/Either'

import { type Attributes, UsuarioSessao } from './UsuarioSessao'
import { type UsuarioSessaoCollection } from './UsuarioSessaoCollection'

interface Dependencies {
  usuarioSessaoCollection: UsuarioSessaoCollection
  now?: () => Date
}

export class BuscaUsuarioSessaoPorHashUseCase {
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection
  private readonly now: () => Date

  constructor(dependencies: Dependencies) {
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
    this.now = dependencies.now ?? (() => new Date())
  }

  async execute(params: { refreshTokenHash: string }): Promise<Either<Error, Attributes | null>> {
    const found = await this.usuarioSessaoCollection.findByRefreshTokenHash(params.refreshTokenHash)
    if (found.left()) {
      return found
    }
    if (!found.value) {
      return Either.right(null)
    }

    const expired = await this.deleteIfExpired(found.value)
    if (expired.left()) {
      return expired
    }
    if (expired.value) {
      return Either.right(null)
    }

    return Either.right(found.value)
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
