import { type Knex } from 'knex'

import { ListaEstadosUseCase } from '@/domain/estado/ListaEstadosUseCase'
import { createAccessToken } from '@/factory/AccessTokenFactory'
import { createAuthorize } from '@/factory/AuthorizeMiddlewareFactory'
import { EstadoCollectionKnexAdapter } from '@/infrastructure/EstadoCollectionKnexAdapter'
import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'
import { UsuarioSessaoCollectionKnexAdapter } from '@/infrastructure/UsuarioSessaoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { ListaEstadosController } from './ListaEstadosController'

export function routes(knex: Knex): Route[] {
  const estadoCollection = new EstadoCollectionKnexAdapter({ knex })
  const authorize = createAuthorize({
    accessToken: createAccessToken(),
    usuarioCollection: new UsuarioCollectionKnexAdapter({ knex }),
    usuarioSessaoCollection: new UsuarioSessaoCollectionKnexAdapter({ knex })
  })

  return [
    {
      handlers: [
        authorize('read', 'Estado'),
        new ListaEstadosController({
          listaEstadosUseCase: new ListaEstadosUseCase({ estadoCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/paises/:paisSigla/estados'
    }
  ]
}
