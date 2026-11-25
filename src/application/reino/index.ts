import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { ReinoCollectionKnexAdapter } from '@/infrastructure/ReinoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaReinoController } from './BuscaReinoController'
import { ListaReinosController } from './ListaReinosController'

export function routes(knex: Knex): Route[] {
  const reinoCollection = new ReinoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Reino'),
        new ListaReinosController({ reinoCollection })
      ],
      method: Method.Get,
      path: '/v1/reinos'
    },
    {
      handlers: [
        authorize('read', 'Reino'),
        new BuscaReinoController({ reinoCollection })
      ],
      method: Method.Get,
      path: '/v1/reinos/:reinoId'
    }
  ]
}
