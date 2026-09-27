import { createRules } from '@/library/auth/createRules'
import { Either } from '@/library/either/Either'

import { ConfirmaSessaoAcessoUseCase } from './ConfirmaSessaoAcessoUseCase'
import { UserNotFoundError } from './error/UserNotFoundError'
import { type UsuarioPublico } from './SessaoAutenticada'
import { type UsuarioCollection } from './UsuarioCollection'
import { usuarioPublico } from './usuarioPublico'

interface Dependencies {
  confirmaSessaoAcessoUseCase: ConfirmaSessaoAcessoUseCase
  usuarioCollection: UsuarioCollection
}

export class MostraSessaoUseCase {
  private readonly confirmaSessaoAcessoUseCase: ConfirmaSessaoAcessoUseCase
  private readonly usuarioCollection: UsuarioCollection

  constructor(dependencies: Dependencies) {
    this.confirmaSessaoAcessoUseCase = dependencies.confirmaSessaoAcessoUseCase
    this.usuarioCollection = dependencies.usuarioCollection
  }

  async execute(params: { accessToken: string }): Promise<Either<Error, {
    user: UsuarioPublico
    rules: ReturnType<typeof createRules>
  }>> {
    const access = await this.confirmaSessaoAcessoUseCase.execute({
      accessToken: params.accessToken
    })
    if (access.left()) {
      return access
    }

    const usuario = await this.usuarioCollection.findById(access.value.sub)
    if (usuario.left()) {
      return usuario
    }
    if (!usuario.value) {
      return Either.left(new UserNotFoundError())
    }

    return Either.right({
      user: usuarioPublico(usuario.value),
      rules: createRules({
        id: usuario.value.id,
        tipo_usuario_id: usuario.value.tipoUsuarioId
      })
    })
  }
}
