import { type Attributes } from '@/domain/usuario/Usuario'

/**
 * Estrutura representativa de uma sessão autenticada com tokens emitidos e atributos do usuário.
 */
export interface SessaoAutenticada {
  accessToken: string
  refreshToken: string
  user: Attributes
}
