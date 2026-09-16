import { type Knex } from 'knex'

import { BuscaRelevoPorIdUseCase } from '@/domain/relevo/BuscaRelevoPorIdUseCase'
import { ListaRelevosUseCase } from '@/domain/relevo/ListaRelevosUseCase'
import { RelevoCollectionKnexAdapter } from '@/infrastructure/RelevoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaRelevoController } from './BuscaRelevoController'
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
        new BuscaRelevoController({
          buscaRelevoPorIdUseCase: new BuscaRelevoPorIdUseCase({ relevoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/relevos/:relevoId'
    }
  ]
}
