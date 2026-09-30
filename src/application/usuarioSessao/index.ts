import { type Knex } from 'knex'

import { CriaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/CriaUsuarioSessaoUseCase'
import { EncerraUsuarioSessaoUseCase } from '@/domain/usuarioSessao/EncerraUsuarioSessaoUseCase'
import { RenovaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/RenovaUsuarioSessaoUseCase'
import { createAccessToken } from '@/factory/AccessTokenFactory'
import { createAuthorize } from '@/factory/AuthorizeMiddlewareFactory'
import { rateLimitMiddleware } from '@/factory/RateLimiterFactory'
import { createRefreshToken } from '@/factory/RefreshTokenFactory'
import { comparaSenha } from '@/helpers/senhas'
import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'
import { UsuarioSessaoCollectionKnexAdapter } from '@/infrastructure/UsuarioSessaoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { CriaUsuarioSessaoController } from './CriaUsuarioSessaoController'
import { EncerraUsuarioSessaoController } from './EncerraUsuarioSessaoController'
import { MostraUsuarioSessaoController } from './MostraUsuarioSessaoController'
import { RenovaUsuarioSessaoController } from './RenovaUsuarioSessaoController'

export function routes(knex: Knex): Route[] {
  const usuarioCollection = new UsuarioCollectionKnexAdapter({ knex })
  const usuarioSessaoCollection = new UsuarioSessaoCollectionKnexAdapter({ knex })
  const refreshToken = createRefreshToken()
  const accessToken = createAccessToken()
  const authorize = createAuthorize({
    accessToken,
    usuarioCollection,
    usuarioSessaoCollection
  })

  return [
    {
      method: Method.Post,
      path: '/auth/login',
      handlers: [
        rateLimitMiddleware,
        new CriaUsuarioSessaoController({
          criaUsuarioSessaoUseCase: new CriaUsuarioSessaoUseCase({
            usuarioCollection,
            usuarioSessaoCollection,
            refreshToken,
            accessToken,
            comparaSenha
          })
        })
      ]
    },
    {
      method: Method.Post,
      path: '/auth/refresh',
      handlers: [
        new RenovaUsuarioSessaoController({
          renovaUsuarioSessaoUseCase: new RenovaUsuarioSessaoUseCase({
            usuarioCollection,
            usuarioSessaoCollection,
            refreshToken,
            accessToken
          })
        })
      ]
    },
    {
      method: Method.Post,
      path: '/auth/logout',
      handlers: [
        new EncerraUsuarioSessaoController({
          accessToken,
          encerraUsuarioSessaoUseCase: new EncerraUsuarioSessaoUseCase({
            usuarioSessaoCollection,
            refreshToken,
            accessToken
          })
        })
      ]
    },
    {
      method: Method.Get,
      path: '/auth/me',
      handlers: [
        authorize('read', 'UsuarioSessao'),
        new MostraUsuarioSessaoController()
      ]
    }
  ]
}
