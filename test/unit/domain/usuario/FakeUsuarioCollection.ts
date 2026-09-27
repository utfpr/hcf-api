import {
  type Attributes, type AttributesComSenha
} from '@/domain/usuario/Usuario'
import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { Either } from '@/library/either/Either'

export class FakeUsuarioCollection implements UsuarioCollection {
  readonly byId = new Map<number, AttributesComSenha>()

  add(user: AttributesComSenha): void {
    this.byId.set(user.id, { ...user })
  }

  findByEmail(email: string): Promise<Either<Error, AttributesComSenha | null>> {
    const row = [...this.byId.values()].find(user => user.email === email)
    return Promise.resolve(Either.right(row ? { ...row } : null))
  }

  findById(id: number): Promise<Either<Error, Attributes | null>> {
    const row = this.byId.get(id)
    if (!row) {
      return Promise.resolve(Either.right(null))
    }

    return Promise.resolve(Either.right({
      id: row.id,
      nome: row.nome,
      email: row.email,
      tipoUsuarioId: row.tipoUsuarioId
    }))
  }
}
