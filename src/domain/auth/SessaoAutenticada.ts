import { type Rule } from '@/library/auth/Manager'

export const ACCESS_EXPIRES_IN_SECONDS = 900

export interface UsuarioPublico {
  id: number
  nome: string
  email: string
  tipo_usuario_id: number
}

export interface SessaoAutenticada {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UsuarioPublico
  rules: Rule[]
}
