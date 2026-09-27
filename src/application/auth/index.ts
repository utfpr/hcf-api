import { type Knex } from 'knex'

import { ConfirmaSessaoAcessoUseCase } from '@/domain/auth/ConfirmaSessaoAcessoUseCase'
import { EncerraSessaoUseCase } from '@/domain/auth/EncerraSessaoUseCase'
import { EntraSessaoUseCase } from '@/domain/auth/EntraSessaoUseCase'
import { MostraSessaoUseCase } from '@/domain/auth/MostraSessaoUseCase'
import { RenovaSessaoUseCase } from '@/domain/auth/RenovaSessaoUseCase'
import { ApagaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessaoUseCase'
import { ApagaUsuarioSessoesUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessoesUseCase'
import { BuscaUsuarioSessaoPorHashUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorHashUseCase'
import { BuscaUsuarioSessaoPorIdUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorIdUseCase'
import { CriaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/CriaUsuarioSessaoUseCase'
import { RotacionaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/RotacionaUsuarioSessaoUseCase'
import { createAccessToken } from '@/factory/AccessTokenFactory'
import { comparaSenha } from '@/helpers/senhas'
import { CryptoRefreshToken } from '@/infrastructure/auth/CryptoRefreshToken'
import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'
import { UsuarioSessaoCollectionKnexAdapter } from '@/infrastructure/UsuarioSessaoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { type Route } from '@/library/http/Router'

import { EncerraSessaoController } from './EncerraSessaoController'
import { EntraSessaoController } from './EntraSessaoController'
import { MostraSessaoController } from './MostraSessaoController'
import { RateLimitMiddleware } from './RateLimitMiddleware'
import { RenovaSessaoController } from './RenovaSessaoController'

export function routes(knex: Knex): Route[] {
  const usuarioCollection = new UsuarioCollectionKnexAdapter({ knex })
  const usuarioSessaoCollection = new UsuarioSessaoCollectionKnexAdapter({ knex })
  const refreshToken = new CryptoRefreshToken()
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
  const confirmaSessaoAcessoUseCase = new ConfirmaSessaoAcessoUseCase({
    accessToken,
    buscaUsuarioSessaoPorIdUseCase
  })

  return [
    {
      method: Method.Post,
      path: '/auth/login',
      handlers: [
        new RateLimitMiddleware(),
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
            rotacionaUsuarioSessaoUseCase,
            apagaUsuarioSessoesUseCase,
            usuarioCollection,
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
          encerraSessaoUseCase: new EncerraSessaoUseCase({
            apagaUsuarioSessaoUseCase,
            apagaUsuarioSessoesUseCase
          }),
          confirmaSessaoAcessoUseCase,
          buscaUsuarioSessaoPorHashUseCase,
          refreshToken
        })
      ]
    },
    {
      method: Method.Get,
      path: '/auth/me',
      handlers: [
        new MostraSessaoController({
          mostraSessaoUseCase: new MostraSessaoUseCase({
            confirmaSessaoAcessoUseCase,
            usuarioCollection
          })
        })
      ]
    }
  ]
}
