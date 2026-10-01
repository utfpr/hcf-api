import { createAccessToken } from '@/factory/AccessTokenFactory'
import { createKnexInstance } from '@/factory/KnexFactory'
import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'
import { UsuarioSessaoCollectionKnexAdapter } from '@/infrastructure/UsuarioSessaoCollectionKnexAdapter'
import { type Action, type Resource } from '@/library/auth/createRules'
import { singleton } from '@/library/singleton'

import { AuthorizeMiddleware } from './AuthorizeMiddleware'

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
      usuarioSessaoCollection
    })
  }
})

export const authorize = createAuthorize()
