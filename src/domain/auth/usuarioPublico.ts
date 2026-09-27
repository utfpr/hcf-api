import { type UsuarioPublico } from './SessaoAutenticada'
import { type UsuarioRecord } from './UsuarioCollection'

export function usuarioPublico(usuario: UsuarioRecord): UsuarioPublico {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo_usuario_id: usuario.tipoUsuarioId
  }
}
