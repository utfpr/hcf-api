import { Either } from '@/library/either/Either'

export interface Attributes {
  id: number
  nome: string
  email: string
  tipoUsuarioId: number
}

export interface AttributesComSenha extends Attributes {
  senha: string
}

export class Usuario {
  readonly id: number
  readonly nome: string
  readonly email: string
  readonly tipoUsuarioId: number
  readonly senha?: string

  private constructor(attributes: Attributes | AttributesComSenha) {
    this.id = attributes.id
    this.nome = attributes.nome
    this.email = attributes.email
    this.tipoUsuarioId = attributes.tipoUsuarioId
    if ('senha' in attributes) {
      this.senha = attributes.senha
    }
  }

  static create(attributes: Attributes | AttributesComSenha): Either<Error, Usuario> {
    if (!Number.isInteger(attributes.id) || attributes.id <= 0) {
      return Either.left(new Error('id do usuário deve ser um inteiro positivo'))
    }
    if (!attributes.email.trim()) {
      return Either.left(new Error('email do usuário não pode ser vazio'))
    }
    if (!Number.isInteger(attributes.tipoUsuarioId) || attributes.tipoUsuarioId <= 0) {
      return Either.left(new Error('tipoUsuarioId deve ser um inteiro positivo'))
    }

    return Either.right(new Usuario(attributes))
  }

  toAttributes(): Attributes {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      tipoUsuarioId: this.tipoUsuarioId
    }
  }
}
