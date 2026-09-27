import { type Attributes } from '@/domain/usuario/Usuario'

export interface SessaoAutenticada {
  accessToken: string
  refreshToken: string
  user: Attributes
}
