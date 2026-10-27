import { type Either } from '@/library/either/Either'

import { type Attributes } from './UsuarioSessao'

export interface RotationUpdate {
  refreshTokenHash: string
  lastUsedAt: Date
  expiresAt: Date
}

export interface UsuarioSessaoCollection {
  create(attributes: Attributes): Promise<Either<Error, Attributes>>
  findById(id: string): Promise<Either<Error, Attributes | null>>
  findByRefreshTokenHash(hash: string): Promise<Either<Error, Attributes | null>>
  updateRotation(id: string, update: RotationUpdate): Promise<Either<Error, Attributes | null>>
  deleteById(id: string): Promise<Either<Error, void>>
  deleteByUsuarioId(usuarioId: number): Promise<Either<Error, void>>
}
