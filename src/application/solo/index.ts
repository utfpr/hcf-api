import { type Knex } from 'knex'

import { BuscaSoloPorIdUseCase } from '@/domain/solo/BuscaSoloPorIdUseCase'
import { ListaSolosUseCase } from '@/domain/solo/ListaSolosUseCase'
import { SoloCollectionKnexAdapter } from '@/infrastructure/SoloCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaSoloController } from './BuscaSoloController'
import { ListaSolosController } from './ListaSolosController'

export function routes(knex: Knex): Route[] {
  const soloCollection = new SoloCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        new ListaSolosController({
          listaSolosUseCase: new ListaSolosUseCase({ soloCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/solos'
    },
    {
      handlers: [
        new BuscaSoloController({
          buscaSoloPorIdUseCase: new BuscaSoloPorIdUseCase({ soloCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/solos/:soloId'
    }
  ]
}
