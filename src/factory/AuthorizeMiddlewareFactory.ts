import { AuthorizeMiddleware } from '@/application/AuthorizeMiddleware'
import { type UsuarioCollection } from '@/domain/usuario/UsuarioCollection'
import { type UsuarioSessaoCollection } from '@/domain/usuarioSessao/UsuarioSessaoCollection'
import { type AccessToken } from '@/library/auth/AccessToken'
import { type Action, type Resource } from '@/library/auth/createRules'
import { type RequestUser } from '@/library/http/common'

interface Dependencies {
  accessToken: AccessToken
  usuarioCollection: UsuarioCollection
  usuarioSessaoCollection: UsuarioSessaoCollection
  legacyFallback?: boolean
  now?: () => Date
  verifyLegacyUser?: (token: string) => RequestUser | null | Promise<RequestUser | null>
}

export function createAuthorize(dependencies: Dependencies) {
  return (action: Action, resource: Resource): AuthorizeMiddleware => {
    return new AuthorizeMiddleware({
      action,
      resource,
      accessToken: dependencies.accessToken,
      usuarioCollection: dependencies.usuarioCollection,
      usuarioSessaoCollection: dependencies.usuarioSessaoCollection,
      legacyFallback: dependencies.legacyFallback,
      now: dependencies.now,
      verifyLegacyUser: dependencies.verifyLegacyUser
    })
  }
}
