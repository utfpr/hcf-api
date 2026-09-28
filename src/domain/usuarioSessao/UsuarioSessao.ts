import { Either } from '@/library/either/Either'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REFRESH_TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export interface Attributes {
  id: string
  usuarioId: number
  refreshTokenHash: string
  createdAt: Date
  lastUsedAt: Date
  expiresAt: Date
}

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

  static refreshExpiresAt(now: Date): Date {
    return new Date(now.getTime() + UsuarioSessao.REFRESH_TTL_DAYS * MILLISECONDS_PER_DAY)
  }

  static expired(expiresAt: Date, now: Date): boolean {
    return expiresAt.getTime() <= now.getTime()
  }

  static create(attributes: Attributes): Either<Error, UsuarioSessao> {
    if (!UUID_PATTERN.test(attributes.id)) {
      return Either.left(new Error('Id da sessão deve ser um UUID'))
    }

    if (!Number.isInteger(attributes.usuarioId) || attributes.usuarioId <= 0) {
      return Either.left(new Error('usuarioId da sessão deve ser um inteiro positivo'))
    }

    if (!REFRESH_TOKEN_HASH_PATTERN.test(attributes.refreshTokenHash)) {
      return Either.left(new Error('refreshTokenHash da sessão deve ser SHA-256 hex'))
    }

    if (attributes.expiresAt.getTime() <= attributes.createdAt.getTime()) {
      return Either.left(new Error('expiresAt da sessão deve ser posterior a createdAt'))
    }

    return Either.right(new UsuarioSessao(attributes))
  }
}
