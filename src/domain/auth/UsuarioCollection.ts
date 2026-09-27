import { type Either } from '@/library/either/Either'

export interface UsuarioRecord {
  id: number
  nome: string
  email: string
  tipoUsuarioId: number
  senhaHash: string
}

export interface UsuarioCollection {
  findByEmail(email: string): Promise<Either<Error, UsuarioRecord | null>>
  findById(id: number): Promise<Either<Error, UsuarioRecord | null>>
}
