import { ApagaUsuarioSessoesUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessoesUseCase'
import { RotacionaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/RotacionaUsuarioSessaoUseCase'
import { type AccessToken } from '@/library/auth/AccessToken'
import { createRules } from '@/library/auth/createRules'
import { Either } from '@/library/either/Either'

import { UserNotFoundError } from './error/UserNotFoundError'
import { ACCESS_EXPIRES_IN_SECONDS, type SessaoAutenticada } from './SessaoAutenticada'
import { type UsuarioCollection } from './UsuarioCollection'
import { usuarioPublico } from './usuarioPublico'

interface Dependencies {
  rotacionaUsuarioSessaoUseCase: RotacionaUsuarioSessaoUseCase
  apagaUsuarioSessoesUseCase: ApagaUsuarioSessoesUseCase
  usuarioCollection: UsuarioCollection
  accessToken: AccessToken
}

export class RenovaSessaoUseCase {
  private readonly rotacionaUsuarioSessaoUseCase: RotacionaUsuarioSessaoUseCase
  private readonly apagaUsuarioSessoesUseCase: ApagaUsuarioSessoesUseCase
  private readonly usuarioCollection: UsuarioCollection
  private readonly accessToken: AccessToken

  constructor(dependencies: Dependencies) {
    this.rotacionaUsuarioSessaoUseCase = dependencies.rotacionaUsuarioSessaoUseCase
    this.apagaUsuarioSessoesUseCase = dependencies.apagaUsuarioSessoesUseCase
    this.usuarioCollection = dependencies.usuarioCollection
    this.accessToken = dependencies.accessToken
  }

  async execute(params: { refreshToken: string }): Promise<Either<Error, SessaoAutenticada>> {
    const rotated = await this.rotacionaUsuarioSessaoUseCase.execute({
      refreshToken: params.refreshToken
    })
    if (rotated.left()) {
      return rotated
    }

    const usuario = await this.usuarioCollection.findById(rotated.value.session.usuarioId)
    if (usuario.left()) {
      return usuario
    }
    if (!usuario.value) {
      await this.apagaUsuarioSessoesUseCase.execute({
        usuarioId: rotated.value.session.usuarioId
      })
      return Either.left(new UserNotFoundError())
    }

    const signed = this.accessToken.sign({
      sub: usuario.value.id,
      sid: rotated.value.session.id,
      role: usuario.value.tipoUsuarioId
    })
    if (signed.left()) {
      return signed
    }

    return Either.right({
      accessToken: signed.value,
      refreshToken: rotated.value.refreshToken,
      expiresIn: ACCESS_EXPIRES_IN_SECONDS,
      user: usuarioPublico(usuario.value),
      rules: createRules({
        id: usuario.value.id,
        tipo_usuario_id: usuario.value.tipoUsuarioId
      })
    })
  }
}
