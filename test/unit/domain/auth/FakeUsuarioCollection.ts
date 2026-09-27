import { type UsuarioCollection, type UsuarioRecord } from '@/domain/auth/UsuarioCollection'
import { Either } from '@/library/either/Either'

export class FakeUsuarioCollection implements UsuarioCollection {
  readonly byId = new Map<number, UsuarioRecord>()
  readonly byEmail = new Map<string, UsuarioRecord>()

  add(usuario: UsuarioRecord): void {
    this.byId.set(usuario.id, usuario)
    this.byEmail.set(usuario.email, usuario)
  }

  findByEmail(email: string): Promise<Either<Error, UsuarioRecord | null>> {
    return Promise.resolve(Either.right(this.byEmail.get(email) ?? null))
  }

  findById(id: number): Promise<Either<Error, UsuarioRecord | null>> {
    return Promise.resolve(Either.right(this.byId.get(id) ?? null))
  }
}
