import { type Knex } from 'knex'

import { AtualizarEventoUseCase } from '@/domain/evento/AtualizarEventoUseCase'
import { BuscarEventoPorIdUseCase } from '@/domain/evento/BuscarEventoPorIdUseCase'
import { CriarEventoUseCase } from '@/domain/evento/CriarEventoUseCase'
import { ListaEventosUseCase } from '@/domain/evento/ListaEventosUseCase'
import { RemoverEventoUseCase } from '@/domain/evento/RemoverEventoUseCase'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { AtualizarEventoController } from './AtualizarEventoController'
import { BuscarEventoController } from './BuscarEventoController'
import { CriarEventoController } from './CriarEventoController'
import { ListaEventosController } from './ListaEventosController'
import { RemoverEventoController } from './RemoverEventoController'

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
        new CriarEventoController({
          criarEventoUseCase: new CriarEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Post,
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
    },
    {
      handlers: [
        new AtualizarEventoController({
          atualizarEventoUseCase: new AtualizarEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Put,
      path: '/v2/eventos/:eventoId'
    },
    {
      handlers: [
        new RemoverEventoController({
          removerEventoUseCase: new RemoverEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/eventos/:eventoId'
    }
  ]
}
