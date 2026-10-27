import { type AttributesComSenha, Usuario } from '@/domain/usuario/Usuario'
import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { Either } from '@/library/either/Either'

export class FakeUsuarioCollection implements UsuarioCollection {
  readonly byId = new Map<number, Usuario>()

  add(user: AttributesComSenha): void {
    const created = Usuario.create(user)
    if (created.right()) {
      this.byId.set(user.id, created.value)
    }
  }

  findByEmail(email: string): Promise<Either<Error, Usuario | null>> {
    const row = [...this.byId.values()].find(user => user.email === email)
    return Promise.resolve(Either.right(row ?? null))
  }

  findById(id: number): Promise<Either<Error, Usuario | null>> {
    const row = this.byId.get(id)
    if (!row) {
      return Promise.resolve(Either.right(null))
    }

    return Promise.resolve(Usuario.create({
      id: row.id,
      nome: row.nome,
      email: row.email,
      tipoUsuarioId: row.tipoUsuarioId
    }))
  }
}
