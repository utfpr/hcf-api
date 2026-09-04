import { type Knex } from 'knex'

import { BuscarRelevoPorIdUseCase } from '@/domain/relevo/BuscarRelevoPorIdUseCase'
import { ListaRelevosUseCase } from '@/domain/relevo/ListaRelevosUseCase'
import { RelevoCollectionKnexAdapter } from '@/infrastructure/RelevoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscarRelevoController } from './BuscarRelevoController'
import { ListaRelevosController } from './ListaRelevosController'

export function routes(knex: Knex): Route[] {
  const relevoCollection = new RelevoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        new ListaRelevosController({
          listaRelevosUseCase: new ListaRelevosUseCase({ relevoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/relevos'
    },
    {
      handlers: [
        new BuscarRelevoController({
          buscarRelevoPorIdUseCase: new BuscarRelevoPorIdUseCase({ relevoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/relevos/:relevoId'
    }
  ]
}
