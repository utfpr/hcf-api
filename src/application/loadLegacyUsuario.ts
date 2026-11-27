import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { decodificaTokenUsuario } from '@/helpers/tokens'
import { type RequestUser } from '@/library/http/common'

/**
 * Decodifica o token JWT emitido pelo sistema legado e carrega os dados do usuário correspondente no banco.
 * Utilizado como fallback de autenticação durante o período de transição entre versões da API.
 *
 * @param token Token JWT legado recebido no cabeçalho Authorization.
 * @param usuarioCollection Repositório para consulta de usuários pelo ID.
 * @returns Dados do usuário autenticado no formato RequestUser, ou undefined se inválido/não encontrado.
 * @throws TokenExpiredError quando o token JWT legado estiver expirado.
 */
export async function loadLegacyUsuario(
  token: string,
  usuarioCollection: UsuarioCollection
): Promise<RequestUser | undefined> {
  let payload: { id?: unknown }
  try {
    payload = decodificaTokenUsuario(token) as { id?: unknown }
  } catch (error) {
    // Propaga explicitamente TokenExpiredError para permitir que o AuthorizeMiddleware diferencie expiração de token inválido
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
