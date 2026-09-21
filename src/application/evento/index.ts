import { type Knex } from 'knex'

import { BuscarEventoPorIdUseCase } from '@/domain/evento/BuscarEventoPorIdUseCase'
import { ListaEventosUseCase } from '@/domain/evento/ListaEventosUseCase'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscarEventoController } from './BuscarEventoController'
import { ListaEventosController } from './ListaEventosController'

export function routes(knex: Knex): Route[] {
  const eventoCollection = new EventoCollectionKnexAdapter({ knex })

  // TODO: adicionar autenticação quando a camada HTTP de autenticação estiver disponível.

  return [
    {
      handlers: [
        new ListaEventosController({
          listaEventosUseCase: new ListaEventosUseCase({ eventoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/expedicoes/:expedicaoId/eventos'
    },
    {
      handlers: [
        new BuscarEventoController({
          buscarEventoPorIdUseCase: new BuscarEventoPorIdUseCase({ eventoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/eventos/:eventoId'
    }
  ]
}
