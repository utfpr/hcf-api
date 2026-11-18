import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { BuscaLocalColetaPorIdUseCase } from '@/domain/localColeta/BuscaLocalColetaPorIdUseCase'
import { ListaLocaisDeColetaUseCase } from '@/domain/localColeta/ListaLocaisDeColetaUseCase'
import { LocalColetaCollectionKnexAdapter } from '@/infrastructure/LocalColetaCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaLocalColetaController } from './BuscaLocalColetaController'
import { ListaLocaisDeColetaController } from './ListaLocaisDeColetaController'

export function routes(knex: Knex): Route[] {
  const localColetaCollection = new LocalColetaCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'LocalColeta'),
        new ListaLocaisDeColetaController({
          listaLocaisDeColetaUseCase: new ListaLocaisDeColetaUseCase({ localColetaCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/locais-coleta'
    },
    {
      handlers: [
        authorize('read', 'LocalColeta'),
        new BuscaLocalColetaController({
          buscaLocalColetaPorIdUseCase: new BuscaLocalColetaPorIdUseCase({ localColetaCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/locais-coleta/:localColetaId'
    }
  ]
}
