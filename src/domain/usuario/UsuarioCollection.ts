import { type Either } from '@/library/either/Either'

import { type Usuario } from './Usuario'

/**
 * Contrato de repositório para consulta e persistência da entidade Usuario.
 */
export interface UsuarioCollection {
  /**
   * Busca um usuário pelo endereço de e-mail cadastrado.
   *
   * @param email E-mail do usuário.
   * @returns Either com a entidade Usuario (ou null se inexistente) ou erro de infraestrutura.
   */
  findByEmail(email: string): Promise<Either<Error, Usuario | null>>

  /**
   * Busca um usuário pelo identificador numérico único.
   *
   * @param id Identificador numérico do usuário.
   * @returns Either com a entidade Usuario (ou null se inexistente) ou erro de infraestrutura.
   */
  findById(id: number): Promise<Either<Error, Usuario | null>>
}
