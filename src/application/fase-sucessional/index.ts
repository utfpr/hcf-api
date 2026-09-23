import { type Knex } from 'knex'

import { BuscaFaseSucessionalUseCase } from '@/domain/faseSucessional/BuscaFaseSucessionalUseCase'
import { CadastraFaseSucessionalUseCase } from '@/domain/faseSucessional/CadastraFaseSucessionalUseCase'
import { ListaFasesSucessionaisUseCase } from '@/domain/faseSucessional/ListaFasesSucessionaisUseCase'
import { RemoveFaseSucessionalUseCase } from '@/domain/faseSucessional/RemoveFaseSucessionalUseCase'
import { RenomeiaFaseSucessionalUseCase } from '@/domain/faseSucessional/RenomeiaFaseSucessionalUseCase'
import { FaseSucessionalCollectionKnexAdapter } from '@/infrastructure/FaseSucessionalCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaFaseSucessionalController } from './BuscaFaseSucessionalController'
import { CadastraFaseSucessionalController } from './CadastraFaseSucessionalController'
import { ListaFasesSucessionaisController } from './ListaFasesSucessionaisController'
import { RemoveFaseSucessionalController } from './RemoveFaseSucessionalController'
import { RenomeiaFaseSucessionalController } from './RenomeiaFaseSucessionalController'
import { RequerAcessoEscritaFaseSucessional } from './RequerAcessoEscritaFaseSucessional'

export function routes(knex: Knex): Route[] {
  const faseSucessionalCollection = new FaseSucessionalCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        new ListaFasesSucessionaisController({
          listaFasesSucessionaisUseCase: new ListaFasesSucessionaisUseCase({ faseSucessionalCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/fases-sucessionais'
    },
    {
      handlers: [
        new BuscaFaseSucessionalController({
          buscaFaseSucessionalUseCase: new BuscaFaseSucessionalUseCase({ faseSucessionalCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/fases-sucessionais/:faseSucessionalId'
    },
    {
      handlers: [
        new RequerAcessoEscritaFaseSucessional(),
        new CadastraFaseSucessionalController({
          cadastraFaseSucessionalUseCase: new CadastraFaseSucessionalUseCase({ faseSucessionalCollection })
        })
      ],
      method: Method.Post,
      path: '/v2/fases-sucessionais'
    },
    {
      handlers: [
        new RequerAcessoEscritaFaseSucessional(),
        new RenomeiaFaseSucessionalController({
          renomeiaFaseSucessionalUseCase: new RenomeiaFaseSucessionalUseCase({ faseSucessionalCollection })
        })
      ],
      method: Method.Put,
      path: '/v2/fases-sucessionais/:faseSucessionalId'
    },
    {
      handlers: [
        new RequerAcessoEscritaFaseSucessional(),
        new RemoveFaseSucessionalController({
          removeFaseSucessionalUseCase: new RemoveFaseSucessionalUseCase({ faseSucessionalCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/fases-sucessionais/:faseSucessionalId'
    }
  ]
}
