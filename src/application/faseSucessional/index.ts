import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { CadastraFaseSucessionalUseCase } from '@/domain/faseSucessional/CadastraFaseSucessionalUseCase'
import { RenomeiaFaseSucessionalUseCase } from '@/domain/faseSucessional/RenomeiaFaseSucessionalUseCase'
import { FaseSucessionalCollectionKnexAdapter } from '@/infrastructure/FaseSucessionalCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaFaseSucessionalController } from './BuscaFaseSucessionalController'
import { CadastraFaseSucessionalController } from './CadastraFaseSucessionalController'
import { ListaFasesSucessionaisController } from './ListaFasesSucessionaisController'
import { RemoveFaseSucessionalController } from './RemoveFaseSucessionalController'
import { RenomeiaFaseSucessionalController } from './RenomeiaFaseSucessionalController'

export function routes(knex: Knex): Route[] {
  const faseSucessionalCollection = new FaseSucessionalCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'FaseSucessional'),
        new ListaFasesSucessionaisController({ faseSucessionalCollection })
      ],
      method: Method.Get,
      path: '/v2/fases-sucessionais'
    },
    {
      handlers: [
        authorize('read', 'FaseSucessional'),
        new BuscaFaseSucessionalController({ faseSucessionalCollection })
      ],
      method: Method.Get,
      path: '/v2/fases-sucessionais/:faseSucessionalId'
    },
    {
      handlers: [
        authorize('create', 'FaseSucessional'),
        new CadastraFaseSucessionalController({
          cadastraFaseSucessionalUseCase: new CadastraFaseSucessionalUseCase({ faseSucessionalCollection })
        })
      ],
      method: Method.Post,
      path: '/v2/fases-sucessionais'
    },
    {
      handlers: [
        authorize('update', 'FaseSucessional'),
        new RenomeiaFaseSucessionalController({
          renomeiaFaseSucessionalUseCase: new RenomeiaFaseSucessionalUseCase({ faseSucessionalCollection })
        })
      ],
      method: Method.Put,
      path: '/v2/fases-sucessionais/:faseSucessionalId'
    },
    {
      handlers: [
        authorize('delete', 'FaseSucessional'),
        new RemoveFaseSucessionalController({ faseSucessionalCollection })
      ],
      method: Method.Delete,
      path: '/v2/fases-sucessionais/:faseSucessionalId'
    }
  ]
}
