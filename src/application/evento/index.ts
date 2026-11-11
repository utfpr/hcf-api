import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { AutorizaExpedicionarioMiddleware } from '@/application/AutorizaExpedicionarioMiddleware'
import { alvoPorEvento, alvoPorExpedicaoDaRota } from '@/application/expedicionarioAlvos'
import { AtualizaEventoUseCase } from '@/domain/evento/AtualizaEventoUseCase'
import { CriaEventoUseCase } from '@/domain/evento/CriaEventoUseCase'
import { RemoveEventoUseCase } from '@/domain/evento/RemoveEventoUseCase'
import { ConsoleLogger } from '@/infrastructure/ConsoleLogger'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'
import { EvidenciaArquivoDiskAdapter } from '@/infrastructure/EvidenciaArquivoDiskAdapter'
import { EvidenciaCollectionKnexAdapter } from '@/infrastructure/EvidenciaCollectionKnexAdapter'
import { ExpedicaoCollectionKnexAdapter } from '@/infrastructure/ExpedicaoCollectionKnexAdapter'
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
  const evidenciaArquivo = new EvidenciaArquivoDiskAdapter()
  const logger = new ConsoleLogger()
  const participacao = new ExpedicaoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Evento'),
        new ListaEventosController({ eventoCollection })
      ],
      method: Method.Get,
      path: '/v1/expedicoes/:expedicaoId/eventos'
    },
    {
      handlers: [
        authorize('create', 'Evento'),
        new AutorizaExpedicionarioMiddleware({
          participacao, resolveAlvo: alvoPorExpedicaoDaRota(), semExpedicao: 'livre'
        }),
        new CriaEventoController({
          criaEventoUseCase: new CriaEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Post,
      path: '/v1/expedicoes/:expedicaoId/eventos'
    },
    {
      handlers: [
        authorize('read', 'Evento'),
        new BuscaEventoController({ eventoCollection })
      ],
      method: Method.Get,
      path: '/v1/eventos/:eventoId'
    },
    {
      handlers: [
        authorize('update', 'Evento'),
        new AutorizaExpedicionarioMiddleware({
          participacao,
          resolveAlvo: alvoPorEvento(eventoCollection),
          dono: { action: 'update', resource: 'Evento' },
          semExpedicao: 'livre'
        }),
        new AtualizaEventoController({
          atualizaEventoUseCase: new AtualizaEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Put,
      path: '/v1/eventos/:eventoId'
    },
    {
      handlers: [
        authorize('delete', 'Evento'),
        new AutorizaExpedicionarioMiddleware({
          participacao,
          resolveAlvo: alvoPorEvento(eventoCollection),
          dono: { action: 'delete', resource: 'Evento' },
          semExpedicao: 'livre'
        }),
        new RemoveEventoController({
          removeEventoUseCase: new RemoveEventoUseCase({
            eventoCollection, evidenciaArquivo, evidenciaCollection, logger
          })
        })
      ],
      method: Method.Delete,
      path: '/v1/eventos/:eventoId'
    }
  ]
}
