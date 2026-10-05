import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { ListaEstadosUseCase } from '@/domain/estado/ListaEstadosUseCase'
import { EstadoCollectionKnexAdapter } from '@/infrastructure/EstadoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { ListaEstadosController } from './ListaEstadosController'

export function routes(knex: Knex): Route[] {
  const estadoCollection = new EstadoCollectionKnexAdapter({ knex })

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
