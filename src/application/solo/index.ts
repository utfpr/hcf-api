import { type Knex } from 'knex'

import { BuscarSoloPorIdUseCase } from '@/domain/solo/BuscarSoloPorIdUseCase'
import { ListaSolosUseCase } from '@/domain/solo/ListaSolosUseCase'
import { SoloCollectionKnexAdapter } from '@/infrastructure/SoloCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscarSoloController } from './BuscarSoloController'
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
        new BuscarSoloController({
          buscarSoloPorIdUseCase: new BuscarSoloPorIdUseCase({ soloCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/solos/:soloId'
    }
  ]
}
