import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { AtualizaEventoUseCase } from '@/domain/evento/AtualizaEventoUseCase'
import { BuscaEventoPorIdUseCase } from '@/domain/evento/BuscaEventoPorIdUseCase'
import { CriaEventoUseCase } from '@/domain/evento/CriaEventoUseCase'
import { ListaEventosUseCase } from '@/domain/evento/ListaEventosUseCase'
import { RemoveEventoUseCase } from '@/domain/evento/RemoveEventoUseCase'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'
import { EvidenciaCollectionKnexAdapter } from '@/infrastructure/EvidenciaCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { AtualizaEventoController } from './AtualizaEventoController'
import { BuscaEventoController } from './BuscaEventoController'
import { CriaEventoController } from './CriaEventoController'
import { ListaEventosController } from './ListaEventosController'
import { RemoveEventoController } from './RemoveEventoController'

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
        new CriaEventoController({
          criaEventoUseCase: new CriaEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Post,
      path: '/v2/expedicoes/:expedicaoId/eventos'
    },
    {
      handlers: [
        authorize('read', 'Evento'),
        new BuscaEventoController({
          buscaEventoPorIdUseCase: new BuscaEventoPorIdUseCase({ eventoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/eventos/:eventoId'
    },
    {
      handlers: [
        authorize('update', 'Evento'),
        new AtualizaEventoController({
          atualizaEventoUseCase: new AtualizaEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Put,
      path: '/v2/eventos/:eventoId'
    },
    {
      handlers: [
        authorize('delete', 'Evento'),
        new RemoveEventoController({
          removeEventoUseCase: new RemoveEventoUseCase({ eventoCollection, evidenciaCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/eventos/:eventoId'
    }
  ]
}
