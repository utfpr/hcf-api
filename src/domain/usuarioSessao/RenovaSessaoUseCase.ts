import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { type AccessToken } from '@/library/auth/AccessToken'
import { Either } from '@/library/either/Either'

import { type ApagaUsuarioSessaoUseCase } from './ApagaUsuarioSessaoUseCase'
import { UserSessionNotFoundError } from './error/UserSessionNotFoundError'
import { type RotacionaUsuarioSessaoUseCase } from './RotacionaUsuarioSessaoUseCase'
import { type SessaoAutenticada } from './sessaoAutenticada'

interface Dependencies {
  usuarioCollection: UsuarioCollection
  rotacionaUsuarioSessaoUseCase: RotacionaUsuarioSessaoUseCase
  apagaUsuarioSessaoUseCase: ApagaUsuarioSessaoUseCase
  accessToken: AccessToken
}

export class RenovaSessaoUseCase {
  private readonly usuarioCollection: UsuarioCollection
  private readonly rotacionaUsuarioSessaoUseCase: RotacionaUsuarioSessaoUseCase
  private readonly apagaUsuarioSessaoUseCase: ApagaUsuarioSessaoUseCase
  private readonly accessToken: AccessToken

  constructor(dependencies: Dependencies) {
    this.usuarioCollection = dependencies.usuarioCollection
    this.rotacionaUsuarioSessaoUseCase = dependencies.rotacionaUsuarioSessaoUseCase
    this.apagaUsuarioSessaoUseCase = dependencies.apagaUsuarioSessaoUseCase
    this.accessToken = dependencies.accessToken
  }

  async execute(params: { refreshToken: string }): Promise<Either<Error, SessaoAutenticada>> {
    const rotated = await this.rotacionaUsuarioSessaoUseCase.execute({
      refreshToken: params.refreshToken
    })
    if (rotated.left()) {
      return rotated
    }

    const found = await this.usuarioCollection.findById(rotated.value.session.usuarioId)
    if (found.left()) {
      return found
    }
    if (!found.value) {
      await this.apagaUsuarioSessaoUseCase.execute({ id: rotated.value.session.id })
      return Either.left(new UserSessionNotFoundError())
    }

    const signed = this.accessToken.sign({
      sub: found.value.id,
      sid: rotated.value.session.id
    })
    if (signed.left()) {
      return signed
    }

    return Either.right({
      accessToken: signed.value,
      refreshToken: rotated.value.refreshToken,
      user: found.value
    })
  }
}
