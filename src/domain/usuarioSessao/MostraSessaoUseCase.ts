import { type Attributes } from '@/domain/usuario/Usuario'
import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { type AccessToken } from '@/library/auth/AccessToken'
import { Either } from '@/library/either/Either'

import { type BuscaUsuarioSessaoPorIdUseCase } from './BuscaUsuarioSessaoPorIdUseCase'
import { UserSessionNotFoundError } from './error/UserSessionNotFoundError'

interface Dependencies {
  accessToken: AccessToken
  usuarioCollection: UsuarioCollection
  buscaUsuarioSessaoPorIdUseCase: BuscaUsuarioSessaoPorIdUseCase
}

export class MostraSessaoUseCase {
  private readonly accessToken: AccessToken
  private readonly usuarioCollection: UsuarioCollection
  private readonly buscaUsuarioSessaoPorIdUseCase: BuscaUsuarioSessaoPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.accessToken = dependencies.accessToken
    this.usuarioCollection = dependencies.usuarioCollection
    this.buscaUsuarioSessaoPorIdUseCase = dependencies.buscaUsuarioSessaoPorIdUseCase
  }

  async execute(params: { accessToken: string }): Promise<Either<Error, Attributes>> {
    const verified = this.accessToken.verify(params.accessToken)
    if (verified.left()) {
      return Either.left(new UserSessionNotFoundError({ cause: verified.value }))
    }

    const session = await this.buscaUsuarioSessaoPorIdUseCase.execute({ id: verified.value.sid })
    if (session.left()) {
      return session
    }
    if (!session.value) {
      return Either.left(new UserSessionNotFoundError())
    }

    const usuario = await this.usuarioCollection.findById(verified.value.sub)
    if (usuario.left()) {
      return usuario
    }
    if (!usuario.value) {
      return Either.left(new UserSessionNotFoundError())
    }

    return Either.right(usuario.value)
  }
}
