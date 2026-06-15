import { type Knex } from 'knex'

import { ListaPaisesUseCase } from '@/domain/pais/ListaPaisesUseCase'
import { PaisCollectionKnexAdapter } from '@/infrastructure/PaisCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { ListaPaisesController } from './ListaPaisesController'

export function routes(knex: Knex): Route[] {
  const paisCollection = new PaisCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        new ListaPaisesController({
          listaPaisesUseCase: new ListaPaisesUseCase({ paisCollection })
        })
      ],
      method: Method.Get,
      path: '/paises'
    }
  ]
}
