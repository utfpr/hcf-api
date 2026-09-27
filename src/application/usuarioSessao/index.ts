import { type Knex } from 'knex'

import { RateLimitMiddleware } from '@/application/RateLimitMiddleware'
import { ApagaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessaoUseCase'
import { ApagaUsuarioSessoesUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessoesUseCase'
import { BuscaUsuarioSessaoPorHashUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorHashUseCase'
import { BuscaUsuarioSessaoPorIdUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorIdUseCase'
import { CriaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/CriaUsuarioSessaoUseCase'
import { EntraSessaoUseCase } from '@/domain/usuarioSessao/EntraSessaoUseCase'
import { MostraSessaoUseCase } from '@/domain/usuarioSessao/MostraSessaoUseCase'
import { RenovaSessaoUseCase } from '@/domain/usuarioSessao/RenovaSessaoUseCase'
import { RotacionaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/RotacionaUsuarioSessaoUseCase'
import { createAccessToken } from '@/factory/AccessTokenFactory'
import { createRateLimiter } from '@/factory/RateLimiterFactory'
import { createRefreshToken } from '@/factory/RefreshTokenFactory'
import { comparaSenha } from '@/helpers/senhas'
import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'
import { UsuarioSessaoCollectionKnexAdapter } from '@/infrastructure/UsuarioSessaoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { Route } from '@/library/http/Router'

import { EncerraSessaoController } from './EncerraSessaoController'
import { EntraSessaoController } from './EntraSessaoController'
import { MostraSessaoController } from './MostraSessaoController'
import { RenovaSessaoController } from './RenovaSessaoController'

export function routes(knex: Knex): Route[] {
  const usuarioCollection = new UsuarioCollectionKnexAdapter({ knex })
  const usuarioSessaoCollection = new UsuarioSessaoCollectionKnexAdapter({ knex })
  const refreshToken = createRefreshToken()
  const accessToken = createAccessToken()

  const criaUsuarioSessaoUseCase = new CriaUsuarioSessaoUseCase({
    usuarioSessaoCollection,
    refreshToken
  })
  const rotacionaUsuarioSessaoUseCase = new RotacionaUsuarioSessaoUseCase({
    usuarioSessaoCollection,
    refreshToken
  })
  const apagaUsuarioSessaoUseCase = new ApagaUsuarioSessaoUseCase({ usuarioSessaoCollection })
  const apagaUsuarioSessoesUseCase = new ApagaUsuarioSessoesUseCase({ usuarioSessaoCollection })
  const buscaUsuarioSessaoPorIdUseCase = new BuscaUsuarioSessaoPorIdUseCase({
    usuarioSessaoCollection
  })
  const buscaUsuarioSessaoPorHashUseCase = new BuscaUsuarioSessaoPorHashUseCase({
    usuarioSessaoCollection
  })

  return [
    {
      method: Method.Post,
      path: '/auth/login',
      handlers: [
        new RateLimitMiddleware({
          limiter: createRateLimiter(),
          isFailure: response => response instanceof HttpError && response.statusCode === 401
        }),
        new EntraSessaoController({
          entraSessaoUseCase: new EntraSessaoUseCase({
            usuarioCollection,
            criaUsuarioSessaoUseCase,
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
        new RenovaSessaoController({
          renovaSessaoUseCase: new RenovaSessaoUseCase({
            usuarioCollection,
            rotacionaUsuarioSessaoUseCase,
            apagaUsuarioSessaoUseCase,
            accessToken
          })
        })
      ]
    },
    {
      method: Method.Post,
      path: '/auth/logout',
      handlers: [
        new EncerraSessaoController({
          refreshToken,
          accessToken,
          buscaUsuarioSessaoPorHashUseCase,
          apagaUsuarioSessaoUseCase,
          apagaUsuarioSessoesUseCase
        })
      ]
    },
    {
      method: Method.Get,
      path: '/auth/me',
      handlers: [
        new MostraSessaoController({
          mostraSessaoUseCase: new MostraSessaoUseCase({
            accessToken,
            usuarioCollection,
            buscaUsuarioSessaoPorIdUseCase
          })
        })
      ]
    }
  ]
}
