import { type Either } from '@/library/either/Either'

import { type UsuarioSessaoCollection } from './UsuarioSessaoCollection'

interface Dependencies {
  usuarioSessaoCollection: UsuarioSessaoCollection
}

export class ApagaUsuarioSessaoUseCase {
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection

  constructor(dependencies: Dependencies) {
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
  }

  async execute(params: { id: string }): Promise<Either<Error, void>> {
    return this.usuarioSessaoCollection.deleteById(params.id)
  }
}
