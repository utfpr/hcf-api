import { Either } from '@/library/either/Either'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REFRESH_TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Atributos persistíveis da sessão de usuário e controle do refresh token.
 */
export interface Attributes {
  id: string
  usuarioId: number
  refreshTokenHash: string
  createdAt: Date
  lastUsedAt: Date
  expiresAt: Date
}

/**
 * Entidade de domínio que gerencia o ciclo de vida da sessão do usuário e rotação do refresh token.
 */
export class UsuarioSessao {
  static readonly REFRESH_TTL_DAYS = 30

  readonly id: string
  readonly usuarioId: number
  readonly refreshTokenHash: string
  readonly createdAt: Date
  readonly lastUsedAt: Date
  readonly expiresAt: Date

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.usuarioId = attributes.usuarioId
    this.refreshTokenHash = attributes.refreshTokenHash
    this.createdAt = attributes.createdAt
    this.lastUsedAt = attributes.lastUsedAt
    this.expiresAt = attributes.expiresAt
  }

  /**
   * Calcula a data de expiração para o refresh token com base no TTL padrão (30 dias).
   *
   * @param now Data base de referência.
   * @returns Data calculada para expiração da sessão.
   */
  static refreshExpiresAt(now: Date): Date {
    return new Date(now.getTime() + UsuarioSessao.REFRESH_TTL_DAYS * MILLISECONDS_PER_DAY)
  }

  /**
   * Avalia se a sessão expirou em relação ao instante informado.
   *
   * @param expiresAt Data limite de expiração da sessão.
   * @param now Data e hora atual de comparação.
   * @returns True se expirada, false caso contrário.
   */
  static expired(expiresAt: Date, now: Date): boolean {
    return expiresAt.getTime() <= now.getTime()
  }

  /**
   * Cria e valida uma nova instância de UsuarioSessao.
   *
   * @param attributes Dados primitivos da sessão.
   * @returns Either com a entidade UsuarioSessao criada ou erro caso ID, hash ou datas sejam inválidos.
   */
  static create(attributes: Attributes): Either<Error, UsuarioSessao> {
    if (!UUID_PATTERN.test(attributes.id)) {
      return Either.left(new Error('Id da sessão deve ser um UUID'))
    }

    if (!Number.isInteger(Number(attributes.usuarioId)) || attributes.usuarioId <= 0) {
      return Either.left(new Error('usuarioId da sessão deve ser um inteiro positivo'))
    }

    // Armazena no banco exclusivamente o hash SHA-256 (64 hex characters) do token para que o segredo puro nunca seja persistido
    if (!REFRESH_TOKEN_HASH_PATTERN.test(attributes.refreshTokenHash)) {
      return Either.left(new Error('refreshTokenHash da sessão deve ser SHA-256 hex'))
    }

    if (attributes.expiresAt.getTime() <= attributes.createdAt.getTime()) {
      return Either.left(new Error('expiresAt da sessão deve ser posterior a createdAt'))
    }

    return Either.right(new UsuarioSessao(attributes))
  }

  /**
   * Converte a entidade de sessão para seus atributos primitivos de persistência.
   *
   * @returns Atributos da sessão.
   */
  toAttributes(): Attributes {
    return {
      id: this.id,
      usuarioId: this.usuarioId,
      refreshTokenHash: this.refreshTokenHash,
      createdAt: this.createdAt,
      lastUsedAt: this.lastUsedAt,
      expiresAt: this.expiresAt
    }
  }
}
