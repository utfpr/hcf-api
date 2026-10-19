import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { AtualizarEventoUseCase } from '@/domain/evento/AtualizarEventoUseCase'
import { BuscarEventoPorIdUseCase } from '@/domain/evento/BuscarEventoPorIdUseCase'
import { CriarEventoUseCase } from '@/domain/evento/CriarEventoUseCase'
import { ListaEventosUseCase } from '@/domain/evento/ListaEventosUseCase'
import { RemoverEventoUseCase } from '@/domain/evento/RemoverEventoUseCase'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'
import { EvidenciaCollectionKnexAdapter } from '@/infrastructure/EvidenciaCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { AtualizarEventoController } from './AtualizarEventoController'
import { BuscarEventoController } from './BuscarEventoController'
import { CriarEventoController } from './CriarEventoController'
import { ListaEventosController } from './ListaEventosController'
import { RemoverEventoController } from './RemoverEventoController'

export function routes(knex: Knex): Route[] {
  const eventoCollection = new EventoCollectionKnexAdapter({ knex })
  const evidenciaCollection = new EvidenciaCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Evento'),
        new ListaEventosController({
          listaEventosUseCase: new ListaEventosUseCase({ eventoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/expedicoes/:expedicaoId/eventos'
    },
    {
      handlers: [
        authorize('create', 'Evento'),
        new CriarEventoController({
          criarEventoUseCase: new CriarEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Post,
      path: '/v2/expedicoes/:expedicaoId/eventos'
    },
    {
      handlers: [
        authorize('read', 'Evento'),
        new BuscarEventoController({
          buscarEventoPorIdUseCase: new BuscarEventoPorIdUseCase({ eventoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/eventos/:eventoId'
    },
    {
      handlers: [
        authorize('update', 'Evento'),
        new AtualizarEventoController({
          atualizarEventoUseCase: new AtualizarEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Put,
      path: '/v2/eventos/:eventoId'
    },
    {
      handlers: [
        authorize('delete', 'Evento'),
        new RemoverEventoController({
          removerEventoUseCase: new RemoverEventoUseCase({ eventoCollection, evidenciaCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/eventos/:eventoId'
    }
  ]
}
