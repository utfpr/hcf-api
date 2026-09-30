import { type Knex } from 'knex'

import { BuscaFaseSucessionalUseCase } from '@/domain/faseSucessional/BuscaFaseSucessionalUseCase'
import { ListaFasesSucessionaisUseCase } from '@/domain/faseSucessional/ListaFasesSucessionaisUseCase'
import { FaseSucessionalCollectionKnexAdapter } from '@/infrastructure/FaseSucessionalCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaFaseSucessionalController } from './BuscaFaseSucessionalController'
import { ListaFasesSucessionaisController } from './ListaFasesSucessionaisController'

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
    }
  ]
}
