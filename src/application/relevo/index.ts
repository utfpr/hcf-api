import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { BuscaRelevoPorIdUseCase } from '@/domain/relevo/BuscaRelevoPorIdUseCase'
import { CadastraRelevoUseCase } from '@/domain/relevo/CadastraRelevoUseCase'
import { ListaRelevosUseCase } from '@/domain/relevo/ListaRelevosUseCase'
import { RemoveRelevoUseCase } from '@/domain/relevo/RemoveRelevoUseCase'
import { RenomeiaRelevoUseCase } from '@/domain/relevo/RenomeiaRelevoUseCase'
import { RelevoCollectionKnexAdapter } from '@/infrastructure/RelevoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaRelevoController } from './BuscaRelevoController'
import { CadastraRelevoController } from './CadastraRelevoController'
import { ListaRelevosController } from './ListaRelevosController'
import { RemoveRelevoController } from './RemoveRelevoController'
import { RenomeiaRelevoController } from './RenomeiaRelevoController'

export function routes(knex: Knex): Route[] {
  const relevoCollection = new RelevoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Relevo'),
        new ListaRelevosController({
          listaRelevosUseCase: new ListaRelevosUseCase({ relevoCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/relevos'
    },
    {
      handlers: [
        authorize('create', 'Relevo'),
        new CadastraRelevoController({
          cadastraRelevoUseCase: new CadastraRelevoUseCase({ relevoCollection })
        })
      ],
      method: Method.Post,
      path: '/v1/relevos'
    },
    {
      handlers: [
        authorize('read', 'Relevo'),
        new BuscaRelevoController({
          buscaRelevoPorIdUseCase: new BuscaRelevoPorIdUseCase({ relevoCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/relevos/:relevoId'
    },
    {
      handlers: [
        authorize('update', 'Relevo'),
        new RenomeiaRelevoController({
          renomeiaRelevoUseCase: new RenomeiaRelevoUseCase({ relevoCollection })
        })
      ],
      method: Method.Put,
      path: '/v1/relevos/:relevoId'
    },
    {
      handlers: [
        authorize('delete', 'Relevo'),
        new RemoveRelevoController({
          removeRelevoUseCase: new RemoveRelevoUseCase({ relevoCollection })
        })
      ],
      method: Method.Delete,
      path: '/v1/relevos/:relevoId'
    }
  ]
}
