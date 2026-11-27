import { type Either } from '@/library/either/Either'

import { type UsuarioSessaoCollection } from './UsuarioSessaoCollection'

/**
 * Dependências requeridas para a instanciação de ApagaUsuarioSessoesUseCase.
 */
interface Dependencies {
  usuarioSessaoCollection: UsuarioSessaoCollection
}

/**
 * Caso de uso para revogação em lote de todas as sessões ativas de um usuário no banco de dados.
 */
export class ApagaUsuarioSessoesUseCase {
  private readonly usuarioSessaoCollection: UsuarioSessaoCollection

  /**
   * @param dependencies Repositório de persistência de sessões de usuário.
   */
  constructor(dependencies: Dependencies) {
    this.usuarioSessaoCollection = dependencies.usuarioSessaoCollection
  }

  /**
   * Remove todas as sessões ativas associadas ao usuário informado.
   *
   * @param params Objeto contendo o ID numérico do usuário.
   * @returns Either void em caso de sucesso ou erro de infraestrutura na exclusão.
   */
  async execute(params: { usuarioId: number }): Promise<Either<Error, void>> {
    return this.usuarioSessaoCollection.deleteByUsuarioId(params.usuarioId)
  }
}
