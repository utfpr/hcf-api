import { ListaEstadosPaisUseCase } from '@/domain/pais/ListaEstadosPaisUseCase'
import { ListaPaisesUseCase } from '@/domain/pais/ListaPaisesUseCase'
import { createPaisCollection } from '@/factory/PaisCollectionFactory'
import { Method } from '@/library/http/common'

import { Route } from '../../library/Application'
import { ListaEstadosPaisController } from './ListaEstadosPaisController'
import { ListaPaisesController } from './ListaPaisesController'

const paisCollection = createPaisCollection()

export const routes: Route[] = [
  {
    method: Method.Get,
    path: '/paises',
    handlers: [
      new ListaPaisesController({
        listaPaisesUseCase: new ListaPaisesUseCase({ paisCollection })
      })
    ]
  },
  {
    method: Method.Get,
    path: '/paises/:pais_sigla/estados',
    handlers: [
      new ListaEstadosPaisController({
        listaEstadosPaisUseCase: new ListaEstadosPaisUseCase({ paisCollection })
      })
    ]
  }
]
