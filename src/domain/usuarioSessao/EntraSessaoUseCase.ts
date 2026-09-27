import { CredenciaisInvalidasError } from '@/domain/usuario/error/CredenciaisInvalidasError'
import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { type AccessToken } from '@/library/auth/AccessToken'
import { Either } from '@/library/either/Either'

import { type CriaUsuarioSessaoUseCase } from './CriaUsuarioSessaoUseCase'
import { type SessaoAutenticada } from './sessaoAutenticada'

interface Dependencies {
  usuarioCollection: UsuarioCollection
  criaUsuarioSessaoUseCase: CriaUsuarioSessaoUseCase
  accessToken: AccessToken
  comparaSenha: (texto: string, hash: string) => boolean
}

export class EntraSessaoUseCase {
  private readonly usuarioCollection: UsuarioCollection
  private readonly criaUsuarioSessaoUseCase: CriaUsuarioSessaoUseCase
  private readonly accessToken: AccessToken
  private readonly comparaSenha: Dependencies['comparaSenha']

  constructor(dependencies: Dependencies) {
    this.usuarioCollection = dependencies.usuarioCollection
    this.criaUsuarioSessaoUseCase = dependencies.criaUsuarioSessaoUseCase
    this.accessToken = dependencies.accessToken
    this.comparaSenha = dependencies.comparaSenha
  }

  async execute(params: { email: string; senha: string }): Promise<Either<Error, SessaoAutenticada>> {
    const found = await this.usuarioCollection.findByEmail(params.email)
    if (found.left()) {
      return found
    }
    if (!found.value || !this.comparaSenha(params.senha, found.value.senha)) {
      return Either.left(new CredenciaisInvalidasError())
    }

    const created = await this.criaUsuarioSessaoUseCase.execute({ usuarioId: found.value.id })
    if (created.left()) {
      return created
    }

    const signed = this.accessToken.sign({
      sub: found.value.id,
      sid: created.value.session.id
    })
    if (signed.left()) {
      return signed
    }

    return Either.right({
      accessToken: signed.value,
      refreshToken: created.value.refreshToken,
      user: {
        id: found.value.id,
        nome: found.value.nome,
        email: found.value.email,
        tipoUsuarioId: found.value.tipoUsuarioId
      }
    })
  }
}
