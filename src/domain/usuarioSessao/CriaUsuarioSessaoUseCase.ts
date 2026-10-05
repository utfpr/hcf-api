import { randomUUID } from 'node:crypto'

import { InvalidCredentialsError } from '@/domain/usuario/error/InvalidCredentialsError'
import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { type AccessToken } from '@/library/auth/AccessToken'
import { type RefreshToken } from '@/library/auth/RefreshToken'
import { Either } from '@/library/either/Either'

import { type SessaoAutenticada } from './sessaoAutenticada'
import { type Attributes, UsuarioSessao } from './UsuarioSessao'
import { type UsuarioSessaoCollection } from './UsuarioSessaoCollection'

interface Dependencies {
  usuarioCollection: UsuarioCollection
  usuarioSessaoCollection: UsuarioSessaoCollection
  refreshToken: RefreshToken
  accessToken: AccessToken
  comparaSenha: (texto: string, hash: string) => boolean
  now?: () => Date
}

export class CriaUsuarioSessaoUseCase {
  private readonly usuarioCollection: UsuarioCollection
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection
  private readonly refreshToken: RefreshToken
  private readonly accessToken: AccessToken
  private readonly comparaSenha: Dependencies['comparaSenha']
  private readonly now: () => Date

  constructor(dependencies: Dependencies) {
    this.usuarioCollection = dependencies.usuarioCollection
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
    this.refreshToken = dependencies.refreshToken
    this.accessToken = dependencies.accessToken
    this.comparaSenha = dependencies.comparaSenha
    this.now = dependencies.now ?? (() => new Date())
  }

  async execute(params: { email: string; senha: string }): Promise<Either<Error, SessaoAutenticada>> {
    const found = await this.usuarioCollection.findByEmail(params.email)
    if (found.left()) {
      return found
    }
    if (!found.value?.senha || !this.comparaSenha(params.senha, found.value.senha)) {
      return Either.left(new InvalidCredentialsError())
    }

    const generated = this.refreshToken.generate()
    if (generated.left()) {
      return generated
    }

    const createdAt = this.now()
    const attributes: Attributes = {
      id: randomUUID(),
      usuarioId: found.value.id,
      refreshTokenHash: generated.value.hash,
      createdAt,
      lastUsedAt: createdAt,
      expiresAt: UsuarioSessao.refreshExpiresAt(createdAt)
    }

    const session = UsuarioSessao.create(attributes)
    if (session.left()) {
      return session
    }

    const persisted = await this.usuarioSessaoCollection.create(session.value.toAttributes())
    if (persisted.left()) {
      return persisted
    }

    const signed = this.accessToken.sign({
      sub: found.value.id,
      sid: persisted.value.id
    })
    if (signed.left()) {
      return signed
    }

    return Either.right({
      accessToken: signed.value,
      refreshToken: generated.value.token,
      user: found.value.toAttributes()
    })
  }
}
