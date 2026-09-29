import { type Either } from '@/library/either/Either'

import { type UsuarioSessaoCollection } from './UsuarioSessaoCollection'

interface Dependencies {
  usuarioSessaoCollection: UsuarioSessaoCollection
}

export class ApagaUsuarioSessoesUseCase {
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection

  constructor(dependencies: Dependencies) {
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
  }

  async execute(params: { usuarioId: number }): Promise<Either<Error, void>> {
    return this.usuarioSessaoCollection.deleteByUsuarioId(params.usuarioId)
  }
}
