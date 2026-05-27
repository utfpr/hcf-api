import { ListaEstadosUseCase } from '@/domain/estado/ListaEstadosUseCase'
import { createEstadoCollection } from '@/factory/EstadoCollectionFactory'
import { Method } from '@/library/http/common'

import { Route } from '../Application'
import { ListaEstadosController } from './ListaEstadosController'

const estadoCollection = createEstadoCollection()

export const routes: Route[] = [
  {
    handlers: [
      new ListaEstadosController({
        listaEstadosUseCase: new ListaEstadosUseCase({ estadoCollection })
      })
    ],
    method: Method.Get,
    path: '/paises/:paisSigla/estados'
  }
]
