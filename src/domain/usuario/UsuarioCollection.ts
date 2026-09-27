import { type Either } from '@/library/either/Either'

import { type Attributes, type AttributesComSenha } from './Usuario'

export interface UsuarioCollection {
  findByEmail(email: string): Promise<Either<Error, AttributesComSenha | null>>
  findById(id: number): Promise<Either<Error, Attributes | null>>
}
