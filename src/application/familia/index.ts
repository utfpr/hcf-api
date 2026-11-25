import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { FamiliaCollectionKnexAdapter } from '@/infrastructure/FamiliaCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaFamiliaController } from './BuscaFamiliaController'
import { ListaFamiliasController } from './ListaFamiliasController'

export function routes(knex: Knex): Route[] {
  const familiaCollection = new FamiliaCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Familia'),
        new ListaFamiliasController({ familiaCollection })
      ],
      method: Method.Get,
      path: '/v1/familias'
    },
    {
      handlers: [
        authorize('read', 'Familia'),
        new BuscaFamiliaController({ familiaCollection })
      ],
      method: Method.Get,
      path: '/v1/familias/:familiaId'
    }
  ]
}
