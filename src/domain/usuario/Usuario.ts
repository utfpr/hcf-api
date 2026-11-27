import { Either } from '@/library/either/Either'

/**
 * Atributos públicos da entidade Usuario.
 */
export interface Attributes {
  id: number
  nome: string
  email: string
  tipoUsuarioId: number
}

/**
 * Atributos da entidade Usuario incluindo o hash da senha, utilizado em operações de autenticação.
 */
export interface AttributesComSenha extends Attributes {
  senha: string
}

/**
 * Entidade de domínio que representa um usuário do sistema.
 */
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

  /**
   * Fábrica estática para criação e validação da entidade Usuario.
   *
   * @param attributes Dados do usuário com ou sem senha criptografada.
   * @returns Either com a entidade Usuario validada ou Error de validação de domínio.
   */
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

  /**
   * Converte a entidade para seus atributos públicos primitivos, omitindo credenciais sensíveis.
   *
   * @returns Atributos públicos do usuário.
   */
  toAttributes(): Attributes {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      tipoUsuarioId: this.tipoUsuarioId
    }
  }
}
