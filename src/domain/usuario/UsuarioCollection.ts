import { type Either } from '@/library/either/Either'

import { type Usuario } from './Usuario'

export interface UsuarioCollection {
  findByEmail(email: string): Promise<Either<Error, Usuario | null>>
  findById(id: number): Promise<Either<Error, Usuario | null>>
}
