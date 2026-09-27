import { CriaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/CriaUsuarioSessaoUseCase'
import { type AccessToken } from '@/library/auth/AccessToken'
import { createRules } from '@/library/auth/createRules'
import { Either } from '@/library/either/Either'

import { InvalidCredentialsError } from './error/InvalidCredentialsError'
import { ACCESS_EXPIRES_IN_SECONDS, type SessaoAutenticada } from './SessaoAutenticada'
import { type UsuarioCollection } from './UsuarioCollection'
import { usuarioPublico } from './usuarioPublico'

export type ComparaSenha = (senha: string, senhaHash: string) => boolean

interface Dependencies {
  usuarioCollection: UsuarioCollection
  criaUsuarioSessaoUseCase: CriaUsuarioSessaoUseCase
  accessToken: AccessToken
  comparaSenha: ComparaSenha
}

export class EntraSessaoUseCase {
  private readonly usuarioCollection: UsuarioCollection
  private readonly criaUsuarioSessaoUseCase: CriaUsuarioSessaoUseCase
  private readonly accessToken: AccessToken
  private readonly comparaSenha: ComparaSenha

  constructor(dependencies: Dependencies) {
    this.usuarioCollection = dependencies.usuarioCollection
    this.criaUsuarioSessaoUseCase = dependencies.criaUsuarioSessaoUseCase
    this.accessToken = dependencies.accessToken
    this.comparaSenha = dependencies.comparaSenha
  }

  async execute(params: { email: string; senha: string }): Promise<Either<Error, SessaoAutenticada>> {
    const usuario = await this.usuarioCollection.findByEmail(params.email)
    if (usuario.left()) {
      return usuario
    }
    if (!usuario.value || !this.comparaSenha(params.senha, usuario.value.senhaHash)) {
      return Either.left(new InvalidCredentialsError())
    }

    const session = await this.criaUsuarioSessaoUseCase.execute({ usuarioId: usuario.value.id })
    if (session.left()) {
      return session
    }

    const signed = this.accessToken.sign({
      sub: usuario.value.id,
      sid: session.value.session.id,
      role: usuario.value.tipoUsuarioId
    })
    if (signed.left()) {
      return signed
    }

    return Either.right({
      accessToken: signed.value,
      refreshToken: session.value.refreshToken,
      expiresIn: ACCESS_EXPIRES_IN_SECONDS,
      user: usuarioPublico(usuario.value),
      rules: createRules({
        id: usuario.value.id,
        tipo_usuario_id: usuario.value.tipoUsuarioId
      })
    })
  }
}
