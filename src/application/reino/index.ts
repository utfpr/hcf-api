import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { BuscaReinoPorIdUseCase } from '@/domain/reino/BuscaReinoPorIdUseCase'
import { CadastraReinoUseCase } from '@/domain/reino/CadastraReinoUseCase'
import { ListaReinosUseCase } from '@/domain/reino/ListaReinosUseCase'
import { RenomeiaReinoUseCase } from '@/domain/reino/RenomeiaReinoUseCase'
import { ReinoCollectionKnexAdapter } from '@/infrastructure/ReinoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaReinoController } from './BuscaReinoController'
import { CadastraReinoController } from './CadastraReinoController'
import { ListaReinosController } from './ListaReinosController'
import { RenomeiaReinoController } from './RenomeiaReinoController'

export function routes(knex: Knex): Route[] {
  const reinoCollection = new ReinoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Reino'),
        new ListaReinosController({
          listaReinosUseCase: new ListaReinosUseCase({ reinoCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/reinos'
    },
    {
      handlers: [
        authorize('create', 'Reino'),
        new CadastraReinoController({
          cadastraReinoUseCase: new CadastraReinoUseCase({ reinoCollection })
        })
      ],
      method: Method.Post,
      path: '/v1/reinos'
    },
    {
      handlers: [
        authorize('read', 'Reino'),
        new BuscaReinoController({
          buscaReinoPorIdUseCase: new BuscaReinoPorIdUseCase({ reinoCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/reinos/:reinoId'
    },
    {
      handlers: [
        authorize('update', 'Reino'),
        new RenomeiaReinoController({
          renomeiaReinoUseCase: new RenomeiaReinoUseCase({ reinoCollection })
        })
      ],
      method: Method.Put,
      path: '/v1/reinos/:reinoId'
    }
  ]
}
