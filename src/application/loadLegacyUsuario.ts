import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { decodificaTokenUsuario } from '@/helpers/tokens'
import { type RequestUser } from '@/library/http/common'

export async function loadLegacyUsuario(
  token: string,
  usuarioCollection: UsuarioCollection
): Promise<RequestUser | undefined> {
  let payload: { id?: unknown }
  try {
    payload = decodificaTokenUsuario(token) as { id?: unknown }
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw error
    }
    return undefined
  }

  const id = Number(payload.id)
  if (!Number.isInteger(id) || id <= 0) {
    return undefined
  }

  const usuario = await usuarioCollection.findById(id)
  if (usuario.left() || !usuario.value) {
    return undefined
  }

  return {
    id: usuario.value.id,
    nome: usuario.value.nome,
    email: usuario.value.email,
    tipo_usuario_id: usuario.value.tipoUsuarioId
  }
}
