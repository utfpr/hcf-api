import { BuscaUsuarioSessaoPorIdUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorIdUseCase'
import { UserSessionNotFoundError } from '@/domain/usuarioSessao/error/UserSessionNotFoundError'
import { type AccessPayload, type AccessToken } from '@/library/auth/AccessToken'
import { Either } from '@/library/either/Either'

interface Dependencies {
  accessToken: AccessToken
  buscaUsuarioSessaoPorIdUseCase: BuscaUsuarioSessaoPorIdUseCase
}

export class ConfirmaSessaoAcessoUseCase {
  private readonly accessToken: AccessToken
  private readonly buscaUsuarioSessaoPorIdUseCase: BuscaUsuarioSessaoPorIdUseCase

  constructor(dependencies: Dependencies) {
    this.accessToken = dependencies.accessToken
    this.buscaUsuarioSessaoPorIdUseCase = dependencies.buscaUsuarioSessaoPorIdUseCase
  }

  async execute(params: { accessToken: string }): Promise<Either<Error, AccessPayload>> {
    const verified = this.accessToken.verify(params.accessToken)
    if (verified.left()) {
      return verified
    }

    const session = await this.buscaUsuarioSessaoPorIdUseCase.execute({ id: verified.value.sid })
    if (session.left()) {
      return session
    }
    if (!session.value || session.value.usuarioId !== verified.value.sub) {
      return Either.left(new UserSessionNotFoundError())
    }

    return Either.right(verified.value)
  }
}
