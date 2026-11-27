import { createAccessToken } from '@/factory/AccessTokenFactory'
import { createKnexInstance } from '@/factory/KnexFactory'
import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'
import { UsuarioSessaoCollectionKnexAdapter } from '@/infrastructure/UsuarioSessaoCollectionKnexAdapter'
import { type Action, type Resource } from '@/library/auth/createRules'
import { singleton } from '@/library/singleton'

import { AuthorizeMiddleware } from './AuthorizeMiddleware'
import { loadLegacyUsuario } from './loadLegacyUsuario'

const createAuthorize = singleton(() => {
  const knex = createKnexInstance()
  const accessToken = createAccessToken()
  const usuarioCollection = new UsuarioCollectionKnexAdapter({ knex })
  const usuarioSessaoCollection = new UsuarioSessaoCollectionKnexAdapter({ knex })

  return (action: Action, resource: Resource): AuthorizeMiddleware => {
    return new AuthorizeMiddleware({
      action,
      resource,
      accessToken,
      usuarioCollection,
      usuarioSessaoCollection,
      legacyFallback: true,
      verifyLegacyUser: token => loadLegacyUsuario(token, usuarioCollection)
    })
  }
})

/**
 * Função de fábrica para criar instâncias de AuthorizeMiddleware associadas à ação e ao recurso.
 * Pré-configura as dependências via adaptadores Knex, gerador de AccessToken e fallback para autenticação legada.
 *
 * @param action Ação a ser autorizada (ex.: 'create', 'read', 'update', 'delete').
 * @param resource Recurso visado na verificação (ex.: 'Expedicao', 'Lembrete').
 * @returns Instância configurada de AuthorizeMiddleware pronta para uso em rotas.
 */
export const authorize = createAuthorize()
