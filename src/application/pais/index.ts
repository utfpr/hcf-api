import { ListaPaisesUseCase } from '@/domain/pais/ListaPaisesUseCase'
import { createPaisCollection } from '@/factory/PaisCollectionFactory'
import { Method } from '@/library/http/common'

import { Route } from '../Application'
import { ListaPaisesController } from './ListaPaisesController'

const paisCollection = createPaisCollection()

export const routes: Route[] = [
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
